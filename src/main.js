const core = require('@actions/core')
const fs = require('fs')
const github = require('@actions/github')
const { createComment, updateComment, findComment } = require('./restClient')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const context = github.context
    const prNumber = context.payload.pull_request?.number
    const prTitle = context.payload.pull_request?.title
    core.info(JSON.stringify(context.payload))
    if (!prNumber || !prTitle) {
      core.setFailed('No issue/pull request in current context.')
      return
    }

    const message = core.getInput('message')
    const filePath = core.getInput('file-path')
    const githubToken = core.getInput('github-token')

    let content = message || ''
    if (!message && filePath) {
      content = fs.readFileSync(filePath, 'utf8')
    }

    const [ticketRepo, ticketNum] = getRepoAndTicket(prTitle)
    if (ticketNum) {
      content =
        `[Click here to visit linked Jira ticket.](https://example.com/${ticketRepo}-${ticketNum})\n${content}`.trim()
    } else {
      content =
        `Add [GLOBAL-XXX] to your PR title to link up your Jira ticket\n${content}`.trim()
    }

    const octokit = github.getOctokit(githubToken)

    const commentTagPattern = `<!-- elasticspoon/actions-comment-pull-request -->`
    const body = `${content}\n${commentTagPattern}`

    const comment = await findComment(
      octokit,
      context,
      prNumber,
      commentTagPattern
    )

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
function getRepoAndTicket(prTitle) {
  const globalMatch = prTitle.match(/\[GLOBAL-(\d{1,5})\]/)
  const diditMatch = prTitle.match(/\[(\d{5})\]/)

  if (globalMatch) {
    return ['GLOBAL', globalMatch[1]]
  } else if (diditMatch) {
    return ['DIDIT', diditMatch[1]]
  } else {
    return [null, null]
  }
}

module.exports = {
  run,
  findComment
}
