import { ActionRowTokens, actionRowCardShell } from "../../styles/action-row-tokens";
import { GlobalStyles } from "../../constants/styles";

describe("action-row-tokens", () => {
  it("locks variant C surface contrast against page background", () => {
    expect(ActionRowTokens.surface).toBe("#FFFFFF");
    expect(ActionRowTokens.surface).not.toBe(GlobalStyles.colors.backgroundColor);
  });

  it("exports a co-located card shell for shadow regression", () => {
    expect(actionRowCardShell.backgroundColor).toBe(ActionRowTokens.surface);
    expect(actionRowCardShell.borderWidth).toBe(ActionRowTokens.borderWidth);
    expect(actionRowCardShell.borderColor).toBe(ActionRowTokens.borderColor);
  });

  it("uses the same subtle press scale as trip list items", () => {
    expect(ActionRowTokens.press).toBe(GlobalStyles.pressedActionRow);
    expect(ActionRowTokens.press.transform).toEqual([{ scale: 0.975 }]);
  });
});
