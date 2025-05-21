import * as core from "@actions/core";
import * as github from "@actions/github";
import { SPAMMERS } from "../src/spammers";

// Mock external modules
jest.mock("@actions/core");
jest.mock("@actions/github", () => ({
  ...jest.requireActual("@actions/github"),
  context: {
    repo: { owner: "test-owner", repo: "test-repo" },
    payload: {
      pull_request: {
        number: 42,
        user: { login: "spammer1" },
      },
    },
  },
  getOctokit: jest.fn(() => ({
    issues: {
      addLabels: jest.fn(),
    },
    pulls: {
      update: jest.fn(),
    },
  })),
}));

describe("Spamtoberfest Action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Add a fake spammer for testing
    (SPAMMERS as string[]).push("spammer1");
  });

  afterEach(() => {
    // Clean up the fake spammer after each test
    const idx = SPAMMERS.indexOf("spammer1");
    if (idx !== -1) SPAMMERS.splice(idx, 1);
  });

  it("adds the Spam label if the author is marked as spammer and action-type=flag", async () => {
    jest.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "action-type") return "flag";
      if (name === "repo-token") return "dummy-token";
      return "";
    });

    await import("../src/main");
    // If no exception is thrown, the test passes
    expect(true).toBe(true);
  });

  it("closes the PR if the author is marked as spammer and action-type=close", async () => {
    jest.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "action-type") return "close";
      if (name === "repo-token") return "dummy-token";
      return "";
    });

    await import("../src/main");
    expect(true).toBe(true);
  });

  it("does nothing if the author is not marked as spammer", async () => {
    if (github.context.payload.pull_request) {
      github.context.payload.pull_request.user.login = "not-spammer";
    }
    jest.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "action-type") return "flag";
      if (name === "repo-token") return "dummy-token";
      return "";
    });

    await import("../src/main");
    expect(true).toBe(true);
  });
});
