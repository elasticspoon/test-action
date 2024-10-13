const core = require('@actions/core')
const fs = require('fs')
const github = require('@actions/github')

async function createComment({ octokit, owner, repo, issueNumber, body }) {
  const { data: comment } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  })

  core.setOutput('id', comment.id)
  core.setOutput('body', comment.body)
  core.setOutput('html-url', comment.html_url)

  return comment
}

async function updateComment({ octokit, owner, repo, commentId, body }) {
  const { data: comment } = await octokit.rest.issues.updateComment({
    owner,
    repo,
    comment_id: commentId,
    body
  })

  core.setOutput('id', comment.id)
  core.setOutput('body', comment.body)
  core.setOutput('html-url', comment.html_url)

  return comment
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const message = core.getInput('message')
    const filePath = core.getInput('file-path')
    const githubToken = core.getInput('github-token')

    // no but maybe something about action type
    // if (!message && !filePath && mode !== 'delete') {
    //   core.setFailed('Either "filePath" or "message" should be provided as input unless running as "delete".');
    //   return;
    // }

    let content = message || ''
    if (!message && filePath) {
      content = fs.readFileSync(filePath, 'utf8')
    }

    const context = github.context

    const prNumber = context.payload.pull_request?.number
    if (!prNumber) {
      core.setFailed('No issue/pull request in current context.')
      return
    }

    const prTitle = context.payload.pull_request?.title
    const titleRegex = new RegExp(`\\[GLOBAL-\\d*\\]`)
    if (!prTitle.match(titleRegex)) {
      content = `Add [GLOBAL-XXX] to your PR title to link up your Jira ticket\n${content}`
    }

    const octokit = github.getOctokit(githubToken)

    const commentTagPattern = `<!-- elasticspoon/actions-comment-pull-request -->`
    const body = `${content}\n${commentTagPattern}`

    if (commentTagPattern) {
      let comment
      for await (const { data: comments } of octokit.paginate.iterator(
        octokit.rest.issues.listComments,
        {
          ...context.repo,
          issue_number: prNumber
        }
      )) {
        comment = comments.find(c => c?.body?.includes(commentTagPattern))
        if (comment) break
      }

      if (comment) {
        await updateComment({
          octokit,
          ...context.repo,
          commentId: comment.id,
          body
        })
        return
      }
    }

    await createComment({
      octokit,
      ...context.repo,
      issueNumber: prNumber,
      body
    })
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

module.exports = {
  run
}
