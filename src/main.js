const core = require('@actions/core')
const fs = require('fs')
const github = require('@actions/github')
const { createComment, updateComment } = require('./restClient')

async function findComment(octokit, context, prNumber, commentTagPattern) {
  for await (const { data: comments } of octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    {
      ...context.repo,
      issue_number: prNumber
    }
  )) {
    const comment = comments.find(c => c?.body?.includes(commentTagPattern))
    if (comment) break
  }
}
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const context = github.context
    const prNumber = context.payload.pull_request?.number
    if (!prNumber) {
      core.setFailed('No issue/pull request in current context.')
      return
    }
    //
    // no but maybe something about action type
    // if (!message && !filePath && mode !== 'delete') {
    //   core.setFailed('Either "filePath" or "message" should be provided as input unless running as "delete".');
    //   return;
    // }

    const message = core.getInput('message')
    const filePath = core.getInput('file-path')
    const githubToken = core.getInput('github-token')

    let content = message || ''
    if (!message && filePath) {
      content = fs.readFileSync(filePath, 'utf8')
    }

    const prTitle = context.payload.pull_request?.title
    const titleRegex = new RegExp(`\\[GLOBAL-\\d*\\]`)
    if (!prTitle.match(titleRegex)) {
      content = `Add [GLOBAL-XXX] to your PR title to link up your Jira ticket\n${content}`
    }

    const octokit = github.getOctokit(githubToken)

    const commentTagPattern = `<!-- elasticspoon/actions-comment-pull-request -->`
    const body = `${content}\n${commentTagPattern}`

    const comment = findComment(octokit, context, prNumber, commentTagPattern)

    if (comment) {
      await updateComment({
        octokit,
        ...context.repo,
        commentId: comment.id,
        body
      })
    } else {
      await createComment({
        octokit,
        ...context.repo,
        issueNumber: prNumber,
        body
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

module.exports = {
  run
}
