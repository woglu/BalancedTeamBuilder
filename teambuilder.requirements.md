## Requirements for the BalancedTeamBuilder App
I want to build a web hosted app for Building a number of best balanced Teams of Players.
1. The app shall be implemented using HTML, CSS and Javascript.
2. Each Player has a defined strength in the range of 1 to 100 given in a file "players.txt"
An example for a players.txt is provided in the same directory.
The players.txt file shall use a CSV format. Like this
`
Player Name, Strength, Comment 
`
3. There shall also be a file preferences.txt which defines pairs of players which prefer to play together or play very well together. Such a pair is annotated with an additional strength which shall be added in case the given to players are on the same team. The preferences.txt file shall use a CSV format. Like this
`
Player 1, Player 2, additidional strengh
`
4. At first the app shows all players from the players.txt file together with the strength.
5. It then the app allows to select a number of players from all players.
6. And it allows to specify the number of teams to build - nr_of_teams.
7. It then tries to build nr_of_teams teams in such a way that the sum of the strengths of the players in each team is balanced as best as possible. Of course, there will be many different solutions and the app shall provide some means to browse through all of them. Solutions which are just permutations of earlier solutions should not be shown again.
8. When presenting the solutions, the pairs from preferences.txt shall be emphesized somehow.
9. Per default, none of the players shall be selected
10. The player strength shall be adjustable in the selection dialogue.
11. And both the player.txt and preferences.txt files shall also be loadable from the web-Server.
12. solutions where the sum of the strengths of a team differs by more then 10% from the average shall be suppressed.
13. A Help button or link pointing to the existing help.html document shall be added to the startup page
14. Also the content ot the loaded preferences.txt shall be presented and the strength valued from there shall be editable.
15. There is no need to store the changes done to players.txt or preferences.txt.
16. The solutions should be ordered starting with those where the difference in the team strength (= sum of each player in the team) is the
 smallest one.
