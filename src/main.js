const core = require('@actions/core')
const fs = require('fs')
const github = require('@actions/github')

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
    const prTitle = context.payload.pull_request?.title
    const titleRegex = new RegExp(`\\[GLOBAL-\\d*\\]`)
    if (!prTitle.match(titleRegex)) {
      content =
        'Add [GLOBAL-XXX] to your PR title to link up your Jira ticket\n' +
        content
    }

    const octokit = github.getOctokit(githubToken)

    async function createComment({ owner, repo, issueNumber, body }) {
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

    async function updateComment({ owner, repo, commentId, body }) {
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

    const commentTagPattern = commentTag
      ? `<!-- elasticspoon/actions-comment-pull-request "${commentTag}" -->`
      : null
    const body = commentTagPattern
      ? `${content}\n${commentTagPattern}`
      : content

    if (commentTagPattern) {
      let comment
      for await (const { data: comments } of octokit.paginate.iterator(
        octokit.rest.issues.listComments,
        {
          ...context.repo,
          issue_number: prNumber
        }
      )) {
        comment = comments.find(comment =>
          comment?.body?.includes(commentTagPattern)
        )
        if (comment) break
      }

      if (comment) {
        await updateComment({
          ...context.repo,
          commentId: comment.id,
          body
        })
        return
      }
    }

    await createComment({
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
