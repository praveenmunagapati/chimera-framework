/* eslint-env mocha */

const path = require('path')
const chai = require('chai')
const chimera = require('../index.js')
const assert = chai.assert

const tmpPath = path.join(__dirname, 'tmp')
const originalSrcFile = path.join(__dirname, 'fractures/cpp/substract.cpp')
const srcFile = path.join(__dirname, 'tmp/substract.cpp')
const dstFile = path.join(__dirname, 'tmp/substract')
const quotedTmpPath = chimera.util.getQuoted(tmpPath)
const quotedOriginalSrcFile = chimera.util.getQuoted(originalSrcFile)
const quotedSrcFile = chimera.util.getQuoted(srcFile)
const quotedDstFile = chimera.util.getQuoted(dstFile)
const copySrcFileCmd = 'cp ' + quotedOriginalSrcFile + ' ' + quotedSrcFile + ' && sleep 0.001'
const removeSrcAndDstFileCmd = 'rm ' + quotedSrcFile + ' && rm ' + quotedDstFile + ' && sleep 0.001'
const command = 'cd ' + quotedTmpPath + ' && g++ -o substract substract.cpp'

describe('eisn', function () {
  this.timeout(5000)

  it('should return error if srcFile not found', function (done) {
    chimera.eisn(srcFile, dstFile, command, function (error, result) {
      if (error) {
        assert.equal(!!error, true)
        return done()
      }
      done(new Error('Error expected, but no error found'))
    })
  })

  it('should return error if command is not valid', function (done) {
    chimera.eisn(srcFile, dstFile, '', function (error, result) {
      if (error) {
        assert.equal(!!error, true)
        return done()
      }
      done(new Error('Error expected, but no error found'))
    })
  })

  it('should run command if dstFile does not exist', function (done) {
    chimera.cmd.get(copySrcFileCmd, function (error, result) {
      if (error) {
        return done(error)
      }
      chimera.eisn(srcFile, dstFile, command, function (error, result) {
        if (error) {
          return done(error)
        }
        assert.deepEqual(result, {isCommandExecuted: true})
        done()
      })
    })
  })

  it('should run command if dstFile exist but older than srcFile', function (done) {
    chimera.cmd.get(copySrcFileCmd, function (error, result) {
      if (error) {
        return done(error)
      }
      chimera.eisn(srcFile, dstFile, command, function (error, result) {
        if (error) {
          return done(error)
        }
        assert.deepEqual(result, {isCommandExecuted: true})
        done()
      })
    })
  })

  it('should not run command if dstFile exist and newer than srcFile (by tool)', function (done) {
    chimera.cmd.get('chimera-eisn substract.cpp substract g++ -o substract substract.cpp', {cwd: path.join(__dirname, 'tmp')}, function (error, result) {
      if (error) {
        return done(error)
      }
      assert.strictEqual(result, '{"result":{"isCommandExecuted":false},"error":false,"errorMessage":""}\n')
      done()
    })
  })

  it('should not run command if dstFile exist and newer than srcFile', function (done) {
    chimera.eisn(srcFile, dstFile, command, function (error, result) {
      if (error) {
        return done(error)
      }
      assert.deepEqual(result, {isCommandExecuted: false})
      chimera.cmd.get(removeSrcAndDstFileCmd, function (error, result) {
        if (error) {
          return done(error)
        }
        done()
      })
    })
  })
})

describe('dollar.eisn', function () {
  this.timeout(5000)

  it('should run command if dstFile does not exist', function (done) {
    chimera.cmd.get(copySrcFileCmd, function (error, result) {
      if (error) {
        return done(error)
      }
      chimera.coreDollar.eisn(srcFile, dstFile, command, function (error, result) {
        if (error) {
          return done(error)
        }
        assert.deepEqual(result, {isCommandExecuted: true})
        done()
      })
    })
  })

  it('should run command if dstFile exist but older than srcFile', function (done) {
    chimera.cmd.get(copySrcFileCmd, function (error, result) {
      if (error) {
        return done(error)
      }
      chimera.coreDollar.eisn(srcFile, dstFile, command, function (error, result) {
        if (error) {
          return done(error)
        }
        assert.deepEqual(result, {isCommandExecuted: true})
        done()
      })
    })
  })

  it('should not run command if dstFile exist and newer than srcFile', function (done) {
    chimera.coreDollar.eisn(srcFile, dstFile, command, function (error, result) {
      if (error) {
        return done(error)
      }
      assert.deepEqual(result, {isCommandExecuted: false})
      chimera.cmd.get(removeSrcAndDstFileCmd, function (error, result) {
        if (error) {
          return done(error)
        }
        done()
      })
    })
  })
})
