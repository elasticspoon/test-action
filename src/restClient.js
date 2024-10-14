const core = require('@actions/core')

/**
 * Creates a new issue comment on a GitHub repository.
 *
 * @async
 * @function createComment
 * @param {Object} options
 * @param {Object} options.octokit - octokit client
 * @param {string} options.owner
 * @param {string} options.repo
 * @param {number} options.issueNumber - The number of the issue where the comment will be created.
 * @param {string} options.body
 * @returns {Promise<Object>} The newly created comment data.
 */
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

/**
 * Updates an existing issue comment on a GitHub repository.
 *
 * @async
 * @function updateComment
 * @param {Object} options
 * @param {Object} options.octokit - octokit client
 * @param {string} options.owner
 * @param {string} options.repo
 * @param {number} options.commentId - The ID of the comment to be updated.
 * @param {string} options.body
 * @returns {Promise<Object>} The updated comment data.
 */
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

async function findComment(octokit, context, prNumber, commentTagPattern) {
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
  return comment
}

module.exports = {
  createComment,
  updateComment,
  findComment
}
