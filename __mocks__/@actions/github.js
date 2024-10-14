const context = {
  payload: {
    pull_request: {
      number: 123,
      title: 'pull request 123',
      head: {
        ref: 'head-branch-name'
      },
      base: {
        ref: 'base-branch-name'
      }
    }
  },
  repo: {
    owner: 'test_user',
    repo: 'test_repo'
  }
}

const mockApi = {
  rest: {
    issues: {
      createComment: jest.fn().mockReturnValue({
        data: {
          comment: {
            id: 123,
            body: 'body',
            html_url: 'url'
          }
        }
      }),
      updateComment: jest.fn().mockReturnValue({
        data: {
          comment: {
            id: 123,
            body: 'body',
            html_url: 'url'
          }
        }
      })
    },
    pulls: {
      get: jest.fn().mockResolvedValue({
        data: {
          labels: []
        }
      }),
      listFiles: {
        endpoint: {
          merge: jest.fn().mockReturnValue({})
        }
      }
    },
    repos: {
      getContent: jest.fn()
    }
  },
  paginate: jest.fn()
}

const getOctokit = jest.fn().mockImplementation(() => mockApi)

module.exports = {
  getOctokit,
  context
}
