#!/usr/bin/env node
/* eslint-disable no-console */

const { execSync } = require("child_process");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
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
    // Capture both stdout and stderr from the error
    const stdout = error.stdout || "";
    const stderr = error.stderr || "";
    const errorMessage = error.message || "";

    // Combine stderr and stdout for error output
    const combinedError = stderr + (stderr && stdout ? "\n" : "") + stdout;

    return {
      success: false,
      output: stdout,
      error: combinedError || errorMessage,
      exitCode: error.status || 1,
    };
  }
}

// Parse ESLint output to count issues and extract file locations
function parseESLintOutput(output) {
  const lines = output.split("\n");

  // Look for the summary line with total problems
  const summaryLine = lines.find(line => line.includes("problems"));
  let totalProblems = 0;
  let errors = 0;
  let warnings = 0;
  const errorLocations = [];
  const warningLocations = [];

  if (summaryLine) {
    const match = summaryLine.match(/(\d+) problems/);
    if (match) {
      totalProblems = parseInt(match[1], 10);
    }
  }

  // Parse individual error and warning lines
  // ESLint compact format: "file:line:col, Error - rule (message)"
  lines.forEach(line => {
    const errorMatch = line.match(/^([^:]+):(\d+):(\d+), Error - (.+)/);
    const warningMatch = line.match(/^([^:]+):(\d+):(\d+), Warning - (.+)/);

    if (errorMatch) {
      const [, file, lineNum, col, message] = errorMatch;
      errorLocations.push({
        file: file.trim(),
        line: parseInt(lineNum, 10),
        column: parseInt(col, 10),
        message: message.trim(),
        type: "error",
      });
    } else if (warningMatch) {
      const [, file, lineNum, col, message] = warningMatch;
      warningLocations.push({
        file: file.trim(),
        line: parseInt(lineNum, 10),
        column: parseInt(col, 10),
        message: message.trim(),
        type: "warning",
      });
    }
  });

  errors = errorLocations.length;
  warnings = warningLocations.length;

  // Use summary count if available, otherwise use individual counts
  let total = totalProblems > 0 ? totalProblems : errors + warnings;

  // If we have a summary count but no individual matches, distribute proportionally
  if (totalProblems > 0 && errors + warnings === 0) {
    // For now, assume all are warnings if we can't parse them individually
    warnings = totalProblems;
    total = totalProblems;
  }

  return {
    errors,
    warnings,
    total,
    errorLocations,
    warningLocations,
  };
}

// Parse Prettier output to count issues and extract file locations
function parsePrettierOutput(output) {
  const lines = output.split("\n");
  const unformattedFiles = [];

  lines.forEach(line => {
    if (line.includes("would be reformatted")) {
      // Extract file path from lines like "src/file.ts would be reformatted"
      const match = line.match(/^(.+?)\s+would be reformatted/);
      if (match) {
        unformattedFiles.push({
          file: match[1].trim(),
          message: "Needs formatting",
        });
      }
    } else if (line.includes("Code style issues found")) {
      // This is a summary line, not a specific file
    }
  });

  return { count: unformattedFiles.length, files: unformattedFiles };
}

// Generate hyperlinks for file locations
function generateHyperlink(file, line, column = 1) {
  const relativePath = file.replace(`${process.cwd()}/`, "");
  // Use ANSI escape sequences to create clickable hyperlinks for Cursor
  return `\x1b]8;;cursor://file${file}:${line}:${column}\x1b\\${relativePath}:${line}:${column}\x1b]8;;\x1b\\`;
}

// Display hyperlinks for issues
function displayIssueLinks(title, locations, maxDisplay = 10) {
  if (locations.length === 0) return;

  console.log(`${colors.cyan}🔗 ${title}:${colors.reset}`);

  const displayLocations = locations.slice(0, maxDisplay);
  displayLocations.forEach((location, index) => {
    const line = location.line || 1;
    const column = location.column || 1;
    const hyperlink = generateHyperlink(location.file, line, column);
    const message = location.message ? ` - ${location.message}` : "";
    const type = location.type ? ` [${location.type.toUpperCase()}]` : "";

    console.log(`  ${index + 1}. ${colors.blue}${hyperlink}${colors.reset}`);
    if (message || type) {
      console.log(`     ${colors.dim}${message}${type}${colors.reset}`);
    }
  });

  if (locations.length > maxDisplay) {
    console.log(`  ... and ${locations.length - maxDisplay} more issues`);
  }
  console.log();
}

// Parse TypeScript output to count issues and extract file locations
function parseTypeScriptOutput(output) {
  const lines = output.split("\n");

  // Look for "Found X errors" summary line first
  const foundLine = lines.find(
    line => line.includes("Found") && line.includes("error")
  );

  let errorCount = 0;
  const errorLocations = [];

  if (foundLine) {
    const match = foundLine.match(/Found (\d+) error/);
    if (match) {
      errorCount = parseInt(match[1], 10);
    }
  }

  // Extract individual error lines and their locations
  // TypeScript error format: "file(line,col): error TSXXXX: message"
  const errorLines = lines.filter(
    line =>
      line.includes("error TS") && line.includes("(") && line.includes(")")
  );

  errorLines.forEach(line => {
    const match = line.match(/^([^(]+)\((\d+),(\d+)\): error/);
    if (match) {
      const [, file, lineNum, col] = match;
      const trimmedFile = file.trim();
      // Convert relative path to absolute path
      const absoluteFile = trimmedFile.startsWith("/")
        ? trimmedFile
        : `${process.cwd()}/${trimmedFile}`;

      errorLocations.push({
        file: absoluteFile,
        line: parseInt(lineNum, 10),
        column: parseInt(col, 10),
        message: line.split(":").slice(3).join(":").trim(),
      });
    }
  });

  if (errorCount === 0) {
    errorCount = errorLocations.length;
  }

  return { count: errorCount, locations: errorLocations };
}

// Main check function
async function checkAll() {
  console.log(
    `${colors.bright}${colors.blue}🚀 Running comprehensive codebase checks...${colors.reset}\n`
  );

  const results = {
    typescript: { success: false, errors: 0, files: 0, locations: [] },
    eslint: {
      success: false,
      errors: 0,
      warnings: 0,
      total: 0,
      errorLocations: [],
      warningLocations: [],
    },
    prettier: { success: false, issues: 0, files: [] },
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

    results.typescript = {
      success: true,
      errors: 0,
      files: fileCount,
      locations: [],
    };
    console.log(
      `${colors.green}✅ TypeScript: No type errors found (${fileCount} files checked)${colors.reset}\n`
    );
  } else {
    const { count: errorCount, locations } = parseTypeScriptOutput(
      tsResult.error
    );
    results.typescript = {
      success: false,
      errors: errorCount,
      files: 0,
      locations,
    };
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
    results.eslint = {
      success: true,
      errors: 0,
      warnings: 0,
      total: 0,
      errorLocations: [],
      warningLocations: [],
    };
    console.log(
      `${colors.green}✅ ESLint: No linting issues found${colors.reset}\n`
    );
  } else {
    let errors, warnings, total, errorLocations, warningLocations;
    try {
      const result = parseESLintOutput(eslintResult.error);
      errors = result.errors;
      warnings = result.warnings;
      total = result.total;
      errorLocations = result.errorLocations;
      warningLocations = result.warningLocations;

      results.eslint = {
        success: errors === 0,
        errors,
        warnings,
        total,
        errorLocations,
        warningLocations,
      };
      totalIssues += total;
      if (errors > 0) hasErrors = true;
    } catch (error) {
      throw error;
    }

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
    results.prettier = { success: true, issues: 0, files: [] };
    console.log(
      `${colors.green}✅ Prettier: All files properly formatted${colors.reset}\n`
    );
  } else {
    const { count: issues, files } = parsePrettierOutput(prettierResult.error);
    results.prettier = { success: issues === 0, issues, files };
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

  // Display TypeScript errors only
  if (results.typescript.locations.length > 0) {
    console.log(
      `${colors.bright}${colors.cyan}🔗 TYPESCRIPT ERRORS${colors.reset}`
    );
    console.log(`${colors.cyan}${"=".repeat(50)}${colors.reset}`);
    console.log(
      `${colors.dim}💡 Click the blue links below to jump to files${colors.reset}\n`
    );

    displayIssueLinks("TypeScript Errors", results.typescript.locations, 5);
    console.log(`${colors.cyan}${"=".repeat(50)}${colors.reset}\n`);
  }

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
