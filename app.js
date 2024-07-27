const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

let db = null
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//1
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`
  const playersList = await db.all(getPlayersQuery)
  response.send(
    playersList.map(each_player => ({
      playerId: each_player.player_id,
      playerName: each_player.player_name,
    })),
  )
})

//2
const convertdbToObject = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  }
}

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`
  const playerDetails = await db.get(getPlayerQuery)
  const req = convertdbToObject(playerDetails)
  response.send(req)
})

//3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const putQuery = `UPDATE player_details SET  player_name='${playerName}' WHERE player_id=${playerId};`
  await db.run(putQuery)
  response.send('Player Details Updated')
})

//4

const convertmatchdbToObject = dbMatch => {
  return {
    matchId: dbMatch.match_id,
    match: dbMatch.match,
    year: dbMatch.year,
  }
}

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`
  const matchDetails = await db.get(getMatchQuery)
  response.send(convertmatchdbToObject(matchDetails))
})

//5

const convertAPIFifth = dbObj => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  }
}

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const query = `SELECT match_details.match_id,match_details.match,match_details.year
  FROM match_details NATURAL JOIN player_match_score WHERE player_id=${playerId};
  `
  const matchList = await db.all(query)
  response.send(matchList.map(eachList => convertAPIFifth(eachList)))
})

//6

const convertAPISixth = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  }
}

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const query = `SELECT player_details.player_id ,player_details.player_name  FROM 
  player_details NATURAL JOIN player_match_score WHERE match_id=${matchId};
  `
  const playerList = await db.all(query)
  response.send(playerList.map(eachList => convertAPISixth(eachList)))
})

//7

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const query = `SELECT player_details.player_id as playerId,player_details.player_name as playerName,
  SUM(player_match_score.score) as totalScore,SUM(fours) as totalFours,SUM(sixes) as totalSixes
   FROM 
  player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id WHERE player_details.player_id=${playerId};`
  const reqList = await db.get(query)
  response.send(reqList)
})

module.exports = app
