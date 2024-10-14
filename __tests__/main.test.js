const github = require('@actions/github')
const core = require('@actions/core')
const fs = require('fs')
const { run } = require('../src/main')
const { findComment, createComment } = require('../src/restClient')

jest.mock('@actions/core')
jest.mock('@actions/github')

const gh = github.getOctokit('_')
const createCommentMock = jest.spyOn(gh.rest.issues, 'createComment')
const updateCommentMock = jest.spyOn(gh.rest.issues, 'updateComment')
// const reposMock = jest.spyOn(gh.rest.repos, 'getContent')
// const paginateMock = jest.spyOn(gh, 'paginate')
// const getPullMock = jest.spyOn(gh.rest.pulls, 'get')
// const readFileSyncMock = jest.spyOn(fs, 'readFileSync')
// const existsSyncMock = jest.spyOn(fs, 'existsSync')
const coreErrorMock = jest.spyOn(core, 'error')
const coreWarningMock = jest.spyOn(core, 'warning')
const coreSetFailedMock = jest.spyOn(core, 'setFailed')
const setOutputSpy = jest.spyOn(core, 'setOutput')

jest.mock('../src/restClient.js', () => ({
  ...jest.requireActual('../src/restClient.js'),
  findComment: jest.fn()
}))

const configureInput = mockInput => {
  jest
    .spyOn(core, 'getInput')
    .mockImplementation((name, ..._opts) => mockInput[name])
}

beforeEach(() => {
  jest.mock('@actions/github')
})
afterEach(() => {
  jest.restoreAllMocks().clearAllMocks()
  findComment.mockRestore()
})

describe('run', () => {
  describe('when pull request num is present in context', () => {
    beforeEach(() => {
      github.context.payload.pull_request.number = null
    })
    afterEach(() => {
      github.context.payload.pull_request.number = 123
    })

    it('sets a failed status when no pull request number is found', async () => {
      configureInput({ message: 'hello' })

      await run()

      expect(coreSetFailedMock).toHaveBeenCalledWith(
        'No issue/pull request in current context.'
      )
    })
  })
  describe('when pr title matches global regex', () => {
    beforeEach(() => {
      github.context.payload.pull_request.title = '[GLOBAL-123] PR'
    })
    afterEach(() => {
      github.context.payload.pull_request.title = 'test pr'
    })

    it('calls createComment with comment_id', async () => {
      configureInput({})

      await run()

      expect(createCommentMock).toHaveBeenCalledWith({
        issue_number: 123,
        owner: 'test_user',
        repo: 'test_repo',
        body: `[Click here to visit linked Jira ticket.](https://example.com/GLOBAL-123)
<!-- elasticspoon/actions-comment-pull-request -->`
      })
    })
  })

  describe('when an existing comment is found', () => {
    beforeEach(() => {
      findComment.mockReturnValue({ id: 1 })
    })

    it('calls createComment with comment_id', async () => {
      configureInput({})

      await run()

      expect(updateCommentMock).toHaveBeenCalledWith({
        comment_id: 1,
        owner: 'test_user',
        repo: 'test_repo',
        body: `Add [GLOBAL-XXX] to your PR title to link up your Jira ticket
<!-- elasticspoon/actions-comment-pull-request -->`
      })
    })
  })

  it('appends comment tag', async () => {
    configureInput({})

    await run()

    expect(createCommentMock).toHaveBeenCalledWith({
      issue_number: 123,
      owner: 'test_user',
      repo: 'test_repo',
      body: `Add [GLOBAL-XXX] to your PR title to link up your Jira ticket
<!-- elasticspoon/actions-comment-pull-request -->`
    })
  })
})
