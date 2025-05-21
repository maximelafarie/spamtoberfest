import * as core from "@actions/core";
import * as github from "@actions/github";

import { SPAMMERS } from "./spammers";

async function run() {
  // TODO: create an automated task that will fetch each account to verify they still exist or if they have been renamed

  try {
    // `action-type` input defined in action metadata file
    const actionType = core.getInput("action-type", { required: true }); // Either flag | close
    const token = core.getInput("repo-token", { required: true });
    const prNumber = getPrNumber();

    // Look for a PR number
    if (!prNumber) {
      console.log("Could not get pull request number from context, exiting");
      return;
    }

    const client = github.getOctokit(token);

    // Check for the PR author in the spammers list
    if (!fetchSpammersList(SPAMMERS)) {
      console.log("No match for the PR author in the spammers list, exiting");
      return;
    }

    // If author found in spammers list, do the defined action on the PR
    if (actionType === "close") {
      await addLabels(client, prNumber, ["Spam"]);
      await closePr(client, prNumber);
      core.info("Pull request automatically closed.");
    } else {
      await addLabels(client, prNumber, ["Spam"]);
      core.info("Spam label added to the pull request.");
    }
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(String(error));
    }
  }

  function getPrNumber(): number | undefined {
    const pullRequest = github.context.payload.pull_request;
    if (!pullRequest) {
      return undefined;
    }

    return pullRequest.number;
  }

  async function addLabels(client: any, prNumber: number, labels: string[]) {
    await client.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: prNumber,
      labels: labels,
    });
  }

  async function closePr(client: any, prNumber: number) {
    await client.pulls.update({
      ...github.context.repo,
      pull_number: prNumber,
      state: "closed",
    });
  }

  function fetchSpammersList(bl: string[]) {
    const pullRequest = github.context.payload.pull_request;

    if (!pullRequest || !pullRequest.user) {
      console.log(
        "could not get PR object or PR object did not have user object",
      );
      return undefined;
    }

    // Get the PR author
    const author: string = pullRequest.user.login;

    // Info message about how many spammers are recorded in the list
    core.info(`${SPAMMERS.length} users are listed as spammers`);

    return bl.includes(author);
  }
}

run();
