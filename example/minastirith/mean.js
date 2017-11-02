function mean (data) {
  let total = data.reduce((total, num) => { return total + num })
  return parseFloat(total) / data.length
}

module.exports = mean

if (require.main === module) {
  let data = JSON.parse(process.argv[2])
  console.log(mean(data))
}
