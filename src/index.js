/**
 * The entrypoint for the action.
 */
const { run } = require('./main')
const { createComment, updateComment } = require('./restClient')

run()
