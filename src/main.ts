import * as core from '@actions/core';
import * as github from '@actions/github';

import { blacklist } from './blacklist';

async function run() {
  // TODO: create an automated task that will fetch each account to verify they still exist or if they have been renamed

  try {
    // `action-type` input defined in action metadata file
    const actionType = core.getInput('action-type', { required: true }); // Either flag | close
    const token = core.getInput('repo-token', { required: true });
    const prNumber = getPrNumber();

    // Look for a PR number
    if (!prNumber) {
      console.log('Could not get pull request number from context, exiting');
      return;
    }

    const client = new github.GitHub(token);

    // Check for the PR author in the blacklist
    if (!fetchBlacklist(blacklist)) {
      console.log('No match for the PR author in the blacklist, exiting');
      return;
    }

    // If author found in blacklist, do the defined action on the PR
    if (actionType === 'close') {
      await addLabels(client, prNumber, ['Spam']);
      await closePr(client, prNumber);
      core.info('Pull request automatically closed.');
    } else {
      await addLabels(client, prNumber, ['Spam']);
      core.info('Spam label added to the pull request.');
    }

  } catch (error) {
    console.log(error);
    core.setFailed(error.message);
  }

  function getPrNumber(): number | undefined {
    const pullRequest = github.context.payload.pull_request;
    if (!pullRequest) {
      return undefined;
    }

    return pullRequest.number;
  }

  async function addLabels(
    client: any,
    prNumber: number,
    labels: string[]
  ) {
    await client.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: prNumber,
      labels: labels
    });
  }

  async function closePr(client: any, prNumber: number) {
    await client.pulls.update({
      ...github.context.repo,
      pull_number: prNumber,
      state: 'closed'
    });
  }

  function fetchBlacklist(bl: string[]) {
    const pullRequest = github.context.payload.pull_request;

    if (!pullRequest || !pullRequest.user) {
      console.log('could not get PR object or PR object did not have user object')
      return undefined;
    }

    // Get the PR author
    const author: string = pullRequest.user.login;

    // Info message about how many spammers are blacklisted
    core.info(`${blacklist.length} users are Blacklisted`);

    return bl.includes(author);
  }

}

run();
