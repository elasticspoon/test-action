const github = require('@actions/github')
const core = require('@actions/core')
const fs = require('fs')
const { run } = require('../src/main')

jest.mock('@actions/core')
jest.mock('@actions/github')

const gh = github.getOctokit('_')
const setLabelsMock = jest.spyOn(gh.rest.issues, 'setLabels')
const reposMock = jest.spyOn(gh.rest.repos, 'getContent')
const paginateMock = jest.spyOn(gh, 'paginate')
const getPullMock = jest.spyOn(gh.rest.pulls, 'get')
const readFileSyncMock = jest.spyOn(fs, 'readFileSync')
const existsSyncMock = jest.spyOn(fs, 'existsSync')
const coreErrorMock = jest.spyOn(core, 'error')
const coreWarningMock = jest.spyOn(core, 'warning')
const coreSetFailedMock = jest.spyOn(core, 'setFailed')
const setOutputSpy = jest.spyOn(core, 'setOutput')

const configureInput = mockInput => {
  jest
    .spyOn(core, 'getInput')
    .mockImplementation((name, ...opts) => mockInput[name])
}

describe('run', () => {
  it('sets a failed status when no pull request number is found', async () => {
    configureInput({ message: 'hello' })
    github.context.payload.pull_request.number = null

    await run()

    expect(coreSetFailedMock).toHaveBeenCalledWith(
      'No issue/pull request in current context.'
    )
  })
})
