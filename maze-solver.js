//Required node dependency if using node.
try {var fetch = require("node-fetch");} catch (e) {console.log(e)}
/*
 *  #Steps summary
 *  1 - Start the race by posting login to https://api.noopschallenge.com/mazebot/race/start 
 *  2 - We then receive the first maze and the urls to send the resolution
 *  3 Once the resolution is sent we will receive the next maze or if the last maze is resolved we will get the url for the cert
 */

const base_url = 'https://api.noopschallenge.com'
const start_url = '/mazebot/race/start'
const data = '{"login": "noopschallenge@github.com"}'
const param = {
    headers: {"content-type": "application/json"},
    body: data,
    method: "POST"
};

// Step 1 - Login, fetch maze and send the maze for resolution
fetch(base_url + start_url, param)
    .then(data => data.json())
    .then(mazeJson => fetchMazeJSON(base_url + mazeJson.nextMaze))
    .then(m => solveMaze(m, base_url))


//  Solve the mazedata solve the maze and post answer for validation
function solveMaze(mazeData, baseUrl) {
    if (!mazeData) return null;
	
	console.log("Solving: ", mazeData.name);
    const mazePath = mazeData.mazePath;
    const startingPosition = mazeData.startingPosition;
    const endingPosition = mazeData.endingPosition;
	const mazeMap = mazeData.map;
    const origin = [[{name: "A", x: startingPosition[1], y: startingPosition[0]}]];
    const strRes = solvePoint(origin, mazeMap)
        .map(x => x.name)
        .reduce((a, b) => a + b)
        .substring(1)

    sendResolution(strRes, baseUrl + mazePath)
    return strRes;
}

/*
 * Walk points recusively finding possible neighbours until the goal (B) is found
 * We start with the first point (A)
 * Then all the possible path are added to a new list. Dead ends (no free neighbours) are dropped.
 */
function solvePoint(points, mazeData) {
	// Array to store all paths that are not dead ends
    const nextMove = [];

	//We will walk all possible paths found previously 
	//and determin if it's we found the paths (B),
	//it's a dead end or we have more neighbours to search
    for (let i = 0; i < points.length; i++) {
        let point = points[i]
		
		//Bounds of the maze, making sure we don't seek out of bound
        const rows = mazeData.length;
        const cols = mazeData[0].length;

		//The last element of the array is were our path continues
        const lastx = point[point.length - 1].x
        const lasty = point[point.length - 1].y

		//For each direction we will check the following
		//Here we start with East and check bounds
        if (lastx < cols && lasty + 1 < rows) {
            coord = mazeData[lastx][lasty + 1];
            const e = { name: "E", x: lastx, y: lasty + 1}
            if (coord === " ") {
				//If it's empty then we still haven't found (B)
				//we'll add it to the nextMove for the next pass
				//we also mark the spot we won't evaluate this spot again.
                mazeData[lastx][lasty + 1] = "→"
                nextMove.push([...point, e])
            } else if (coord == "B") {
				//If it's found.. well great, we return the result
                return [...point, e];
            }
        }
        if (lastx < cols && lasty - 1 >= 0) {
            coord = mazeData[lastx][lasty - 1];
            const w = {name: "W", x: lastx, y: lasty - 1}
            if (coord === " ") {
                mazeData[lastx][lasty - 1] = "?"
				mazeData[lastx][lasty] = "←"
                nextMove.push([...point, w])
            } else if (coord == "B") {
                return [...point, w];
            }
        }
        if (lastx + 1 < cols && lasty < rows) {
            const coord = mazeData[lastx + 1][lasty];
            const s = {name: "S", x: lastx + 1, y: lasty}
            if (coord === " ") {
                mazeData[lastx + 1][lasty] = "↓";
                nextMove.push([...point, s])
            } else if (coord == "B") {
                return [...point, s];
            }
        }
        if (lastx - 1 >= 0 && lasty < rows) {
            const coord = mazeData[lastx - 1][lasty];
            const n = {name: "N", x: lastx - 1, y: lasty}
            if (coord === " ") {
                mazeData[lastx - 1][lasty] = "↑"
                nextMove.push([...point, n])
            } else if (coord == "B") {
                return [...point, n];
            }
        }
    }

	//If we get more things to evaluate we call solvePoint recursively
    if (nextMove.length > 0) {
        return solvePoint(nextMove, mazeData)
    }
	//Something wrong, we'll never find (B) :(
    return [];
}

// Get the Json of the maze from Url
function fetchMazeJSON(maze_url) {
    return fetch(maze_url)
        .then(data => data.json());
}

// Send resolution and solve next maze
function sendResolution(resolution, url) {
    const resJson = `{"directions":"${resolution}"}`
    const param = {
        headers: {"content-type": "application/json"},
        body: resJson,
        method: "POST"
    };
    fetch(url, param)
        .then(data => data.json())
        .then(mazeJson => {
            if (mazeJson.nextMaze) {
                console.log(mazeJson)
                return fetchMazeJSON(base_url + mazeJson.nextMaze)
            }
            console.log(mazeJson)
            return null
        })
        .then(m => solveMaze(m, base_url))
}