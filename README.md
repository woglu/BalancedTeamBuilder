# BalancedTeamBuilder
Web app for creating teams which are best balanced regarding the players strengths.

The app uses two files as input.
1. players.txt
   This file defines the available players together with their individual strength. The strength is a number from 1 to 100. The file is in the following CSV format
   Name , strength, comment
   The docs directory contains an example player.txt file

3. preferences.txt
   This file defines certain preferences among the players and their impact on the team strength. If player A and player B play very well together, the overall team strength is increased by a certain amount. Also this file is in CSV format.
   Name 1, Name 2, additional strength
   The docs directory contains and example preferences.txt file.

The app can create 2 or more teams.

See docs/help.html for detailed instructions on how to use the app.

Author: Wolfgang Glunz with the help of Google Antigravity
