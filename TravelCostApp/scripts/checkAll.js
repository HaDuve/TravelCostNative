#!/usr/bin/env node
/* eslint-disable no-console */

const { execSync } = require("child_process");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

// Helper function to run commands and capture output
function runCommand(command, description) {
  console.log(`${colors.cyan}🔍 ${description}...${colors.reset}`);

  try {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: "pipe",
      cwd: process.cwd(),
    });
    return { success: true, output, error: null, exitCode: 0 };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || "",
      error: error.stderr || error.message,
      exitCode: error.status || 1,
    };
  }
}

// Parse ESLint output to count issues
function parseESLintOutput(output) {
  const lines = output.split("\n");
  const errorLines = lines.filter(line => line.includes(" Error - "));
  const warningLines = lines.filter(line => line.includes(" Warning - "));

  // Check for summary line with total problems
  const summaryLine = lines.find(line => line.includes("problems"));
  let totalProblems = 0;

  if (summaryLine) {
    const match = summaryLine.match(/(\d+) problems/);
    if (match) {
      totalProblems = parseInt(match[1], 10);
    }
  }

  const errors = errorLines.length;
  const warnings = warningLines.length;
  const total = totalProblems > 0 ? totalProblems : errors + warnings;

  return { errors, warnings, total };
}

// Parse Prettier output to count issues
function parsePrettierOutput(output) {
  const lines = output.split("\n");
  const unformattedFiles = lines.filter(
    line =>
      line.includes("Code style issues found") ||
      line.includes("would be reformatted")
  );

  return unformattedFiles.length;
}

// Parse TypeScript output to count issues
function parseTypeScriptOutput(output) {
  const lines = output.split("\n");
  const errorLines = lines.filter(
    line =>
      line.includes("error TS") ||
      (line.includes("Found") && line.includes("error"))
  );

  // Extract error count from "Found X errors" line
  const foundLine = lines.find(
    line => line.includes("Found") && line.includes("error")
  );
  let errorCount = 0;

  if (foundLine) {
    const match = foundLine.match(/Found (\d+) error/);
    if (match) {
      errorCount = parseInt(match[1], 10);
    }
  } else {
    // If no "Found X errors" line, count individual error lines
    errorCount = errorLines.length;
  }

  return errorCount;
}

// Main check function
async function checkAll() {
  console.log(
    `${colors.bright}${colors.blue}🚀 Running comprehensive codebase checks...${colors.reset}\n`
  );

  const results = {
    typescript: { success: false, errors: 0, files: 0 },
    eslint: { success: false, errors: 0, warnings: 0, total: 0 },
    prettier: { success: false, issues: 0 },
  };

  let totalIssues = 0;
  let hasErrors = false;

  // 1. TypeScript Check
  console.log(
    `${colors.yellow}📋 STEP 1: TypeScript Type Checking${colors.reset}`
  );
  const tsResult = runCommand(
    "npx tsc --noEmit --skipLibCheck",
    "TypeScript compilation check"
  );

  if (tsResult.success) {
    // When TypeScript succeeds, count files using --listFiles
    const listFilesResult = runCommand(
      "npx tsc --noEmit --skipLibCheck --listFiles",
      "Getting TypeScript file list"
    );

    let fileCount = 0;
    if (listFilesResult.success) {
      // Count only project files (exclude node_modules)
      const projectFiles = listFilesResult.output
        .split("\n")
        .filter(line => line.trim() && !line.includes("node_modules"));
      fileCount = projectFiles.length;
    }

    results.typescript = { success: true, errors: 0, files: fileCount };
    console.log(
      `${colors.green}✅ TypeScript: No type errors found (${fileCount} files checked)${colors.reset}\n`
    );
  } else {
    const errorCount = parseTypeScriptOutput(tsResult.error);
    results.typescript = { success: false, errors: errorCount, files: 0 };
    totalIssues += errorCount;
    hasErrors = true;
    console.log(
      `${colors.red}❌ TypeScript: ${errorCount} type errors found${colors.reset}\n`
    );
  }

  // 2. ESLint Check
  console.log(
    `${colors.yellow}📋 STEP 2: ESLint Code Quality Check${colors.reset}`
  );
  const eslintResult = runCommand(
    "npx eslint . --format=compact",
    "ESLint code quality check"
  );

  if (eslintResult.success) {
    results.eslint = { success: true, errors: 0, warnings: 0, total: 0 };
    console.log(
      `${colors.green}✅ ESLint: No linting issues found${colors.reset}\n`
    );
  } else {
    const { errors, warnings, total } = parseESLintOutput(eslintResult.error);
    results.eslint = { success: errors === 0, errors, warnings, total };
    totalIssues += total;
    if (errors > 0) hasErrors = true;

    if (total === 0) {
      console.log(
        `${colors.green}✅ ESLint: No linting issues found${colors.reset}\n`
      );
    } else {
      const status = errors > 0 ? "❌" : "⚠️";
      const color = errors > 0 ? colors.red : colors.yellow;
      console.log(
        `${color}${status} ESLint: ${errors} errors, ${warnings} warnings (${total} total issues)${colors.reset}\n`
      );
    }
  }

  // 3. Prettier Check
  console.log(
    `${colors.yellow}📋 STEP 3: Prettier Code Formatting Check${colors.reset}`
  );
  const prettierResult = runCommand(
    "npx prettier --check .",
    "Prettier formatting check"
  );

  if (prettierResult.success) {
    results.prettier = { success: true, issues: 0 };
    console.log(
      `${colors.green}✅ Prettier: All files properly formatted${colors.reset}\n`
    );
  } else {
    const issues = parsePrettierOutput(prettierResult.error);
    results.prettier = { success: issues === 0, issues };
    totalIssues += issues;

    if (issues === 0) {
      console.log(
        `${colors.green}✅ Prettier: All files properly formatted${colors.reset}\n`
      );
    } else {
      console.log(
        `${colors.red}❌ Prettier: ${issues} files need formatting${colors.reset}\n`
      );
    }
  }

  // 4. Summary
  console.log(`${colors.bright}${colors.blue}📊 CHECK SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${"=".repeat(50)}${colors.reset}`);

  // TypeScript summary
  if (results.typescript.success || results.typescript.errors === 0) {
    console.log(
      `${colors.green}✅ TypeScript: ${results.typescript.files} files checked, no errors${colors.reset}`
    );
  } else {
    console.log(
      `${colors.red}❌ TypeScript: ${results.typescript.errors} type errors${colors.reset}`
    );
  }

  // ESLint summary
  if (results.eslint.success) {
    console.log(`${colors.green}✅ ESLint: No issues found${colors.reset}`);
  } else {
    const status = results.eslint.errors > 0 ? "❌" : "⚠️";
    const color = results.eslint.errors > 0 ? colors.red : colors.yellow;
    console.log(
      `${color}${status} ESLint: ${results.eslint.errors} errors, ${results.eslint.warnings} warnings${colors.reset}`
    );
  }

  // Prettier summary
  if (results.prettier.success) {
    console.log(
      `${colors.green}✅ Prettier: All files formatted${colors.reset}`
    );
  } else {
    console.log(
      `${colors.red}❌ Prettier: ${results.prettier.issues} files need formatting${colors.reset}`
    );
  }

  console.log(`${colors.blue}${"=".repeat(50)}${colors.reset}`);

  // Final result
  if (totalIssues === 0) {
    console.log(
      `${colors.bright}${colors.green}🎉 ALL CHECKS PASSED! Codebase is clean and ready for production.${colors.reset}`
    );
    console.log(`${colors.green}✅ Total issues: 0${colors.reset}\n`);
    process.exit(0);
  } else {
    const statusIcon = hasErrors ? "❌" : "⚠️";
    const statusColor = hasErrors ? colors.red : colors.yellow;
    const statusText = hasErrors ? "FAILED" : "WARNINGS";

    console.log(
      `${statusColor}${statusIcon} CHECKS ${statusText}!${colors.reset}`
    );
    console.log(
      `${statusColor}Total issues found: ${totalIssues}${colors.reset}\n`
    );

    // Pipeline-friendly output
    console.log(`${colors.blue}# Pipeline Summary:${colors.reset}`);
    console.log(`TYPESCRIPT_ERRORS=${results.typescript.errors}`);
    console.log(`ESLINT_ERRORS=${results.eslint.errors}`);
    console.log(`ESLINT_WARNINGS=${results.eslint.warnings}`);
    console.log(`PRETTIER_ISSUES=${results.prettier.issues}`);
    console.log(`TOTAL_ISSUES=${totalIssues}`);
    console.log(`HAS_ERRORS=${hasErrors ? "true" : "false"}`);

    process.exit(hasErrors ? 1 : 0);
  }
}

// Run the checks
checkAll().catch(error => {
  console.error(
    `${colors.red}💥 Fatal error during checks:${colors.reset}`,
    error.message
  );
  process.exit(1);
});
