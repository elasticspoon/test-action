const github = require('@actions/github')
const core = require('@actions/core')
const fs = require('fs')
const { run } = require('../src/main')

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
    .mockImplementation((name, ...opts) => mockInput[name])
}

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets a failed status when no pull request number is found', async () => {
    configureInput({ message: 'hello' })
    github.context.payload.pull_request.number = null

    await run()

    expect(coreSetFailedMock).toHaveBeenCalledWith(
      'No issue/pull request in current context.'
    )
  })

  it('prepends comment tag', async () => {
    configureInput({ message: 'hello' })
    github.context.payload.pull_request.number = 123

    await run()

    expect(createCommentMock).toHaveBeenCalledWith({
      issue_number: 123,
      owner: 'test_user',
      repo: 'test_repo',
      body: `Add [GLOBAL-XXX] to your PR title to link up your Jira ticket
hello
<!-- elasticspoon/actions-comment-pull-request -->`
    })
  })
})
