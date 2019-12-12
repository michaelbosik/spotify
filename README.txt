Spotify PlaySort
By Dan Duff and Michael Bosik

Resources:
Spotify Developer API - https://developer.spotify.com/documentation/web-api/
Google Charts - https://developers.google.com/chart
Bootstrap - https://getbootstrap.com/
AJAX - https://api.jquery.com/jquery.ajax/

Demonstration Video - https://youtu.be/4_rtcPDrQAE

Project Live Site - playsort.glitch.me

Project Description:

PlaySort is a web application that uses the spotify API to allow a Spotify user
to sort one of their saved playlists using parameters that they choose. The
parameters are values stored within each song such as [danceability, speechiness,
instrumentalness, valence, energy, acousticness]. These values sound made up, 
however they are a part of the EchoNest library that Spotify implemented in 2014.
Each song recieves a relevancy score depending on how similar its features are to 
the users entered settings. The songs are then sorted by score with the most relevant
song in the middle of the list and evenly distributing lower scores outward.
This creates a bell curve of relevant songs depending on the settings that the user
entered.