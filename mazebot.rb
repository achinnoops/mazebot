#
# Ruby automated mazebot racer example
#
# Can you write a program that finishes the race?
#
require "net/http"
require "json"

def main
  # get started — replace with your login
  puts "Enter username:"
  username = gets.delete("\n")
  start = post_json('/mazebot/race/start', { :login => username })

  maze_path = start['nextMaze']
  # get the first maze
  next_maze = get_json(maze_path)
  # Answer each question, as long as we are correct
  loop do
	puts "Solving: " + next_maze['name']
    # your code to figure out the answer could also go here
    # directions = gets.delete("\n")
	
	move_list = [[["A", next_maze['startingPosition'][1], next_maze['startingPosition'][0]]]]

	directionsMap = solve_maze(next_maze['map'], move_list)

	directions = ""
	directionsMap.each { |move|
	   directions = directions + move[0]
	}
	directions = directions.slice(1, directions.length)
    # send to mazebot
    solution_result = send_solution(maze_path, directions)
    if solution_result['result'] == 'success'
      maze_path = solution_result['nextMaze']
	 
      next_maze = get_json(maze_path)
	elsif solution_result['result'] == 'finished'
	   puts solution_result
	   break
    end
  end
end

def solve_maze(mazeData, move_list)
  nextMove = Array.new
  move_list.each { |move|
  
    rows = mazeData.length
	cols = mazeData.first.length

	lastx = move.last[1]
	lasty = move.last[2]
	
	if lastx < cols and lasty + 1 < rows
		coord = mazeData[lastx][lasty + 1]
		e = ["E", lastx, lasty + 1]
		if coord === " "
			mazeData[lastx][lasty + 1] = "→"
			mv = move.dup().push(e)
			nextMove.push(mv)
		elsif coord === "B"
			 move.push(e)
			 return move
		end
	end
	
	if lastx < cols and lasty - 1 >= 0
		coord = mazeData[lastx][lasty - 1]
		w = ["W", lastx, lasty - 1]
		if coord === " "
			mazeData[lastx][lasty - 1] = "<"			
			mv = move.dup().push(w)
			nextMove.push(mv)
		elsif coord === "B"
			 move.push(w)
			 return move
		end
	end
	
	
	if lastx + 1 < cols and lasty < rows
		coord = mazeData[lastx + 1][lasty]
		s = ["S", lastx + 1, lasty]
		if coord === " "
			mazeData[lastx + 1][lasty] = "v"
			mv = move.dup().push(s)
			nextMove.push(mv)
		elsif coord === "B"
			 move.push(s)
			 return move
		end
	end
	
	
	if lastx - 1 >= 0 and lasty < rows
		coord = mazeData[lastx - 1][lasty]
		n = ["N", lastx - 1, lasty]
		if coord === " "
			mazeData[lastx - 1][lasty] = "^"
			mv = move.dup().push(n)
			nextMove.push(mv)
		elsif coord === "B"
			 move.push(n)
			 return move
		end
	end
  }
  
  	if nextMove.length > 0
		return solve_maze(mazeData, nextMove)
	end
		
	return []
  
end

def send_solution(path, directions)
  post_json(path, { :directions => directions })
end

# get data from the api and parse it into a ruby hash
def get_json(path)
  puts "*** GET #{path}"

  response = Net::HTTP.get_response(build_uri(path))
  result = JSON.parse(response.body)
  puts "HTTP #{response.code}"

  #puts JSON.pretty_generate(result)
  result
end

# post an answer to the noops api
def post_json(path, body)
  uri = build_uri(path)
  puts "*** POST #{path}"
  puts JSON.pretty_generate(body)

  post_request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
  post_request.body = JSON.generate(body)

  response = Net::HTTP.start(uri.hostname, uri.port, :use_ssl => true) do |http|
    http.request(post_request)
  end

  puts "HTTP #{response.code}"
  result = JSON.parse(response.body)
  puts result[:result]
  result
end

def build_uri(path)
  URI.parse("https://api.noopschallenge.com" + path)
end

main()
