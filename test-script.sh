read -p $'\nCreate user'
curl -X "POST" "http://localhost:3000/users" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{
  "email": "williehwc@gmail.com",
  "password": "asdf",
  "userName": "williehwc",
  "owner": true
}'

read -p $'\nLog in'
curl -X "POST" "http://localhost:3000/login" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{
  "email": "williehwc@gmail.com",
  "password": "asdf"
}'

read -p $'\nLog in (admin)'
curl -X "POST" "http://localhost:3000/login" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{
  "email": "admin@phenotate.org",
  "password": "asdf"
}'

read -p $'\nGet user\'s public details'
curl "http://localhost:3000/users/1" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es"

read -p $'\nGet user\'s private details'
curl "http://localhost:3000/users/1/private" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es"

read -p $'\nUpdate user'
curl -X "PUT" "http://localhost:3000/users/1" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{
  "oldPassword": "asdf",
  "email": "williehwc@hotmail.com",
  "password": "qwerty"
}'

read -p $'\nCreate menu'
curl -X "POST" "http://localhost:3000/menus" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{
  "address": "1 Main Street",
  "restaurantName": "Tim Hortons",
  "menuName": "Specials"
}'

read -p $'\nGet menu'
curl "http://localhost:3000/menus/1" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es"

read -p $'\nUpdate menu'
curl -X "PUT" "http://localhost:3000/menus/1" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{
  "address": "1000 Main Street"
}'

read -p $'\nAdd food'
curl -X "POST" "http://localhost:3000/foods" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{
  "allergens": [],
"photo": "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAA6RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxNy0wMy0wNFQxMTowMzoyMTwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+UGl4ZWxtYXRvciAzLjY8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+NTwvdGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+NzI8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+ODwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+ODwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo5/N7NAAAANUlEQVQIHWP8//8/AzbABBJUZwQhCICxwRJQMRSKEa9RKEqhHJgdyHJg+1igInDLYSpw2gEAiqsKH1xFxdwAAAAASUVORK5CYII=",
  "menuID": 1,
  "mealType": "Side",
  "cuisine": "American",
  "foodName": "Potato wedges"
}'

read -p $'\nGet food details'
curl "http://localhost:3000/foods/1" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es"

read -p $'\nGet and view food details'
curl "http://localhost:3000/foods/1/view" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es"

read -p $'\nModify food'
curl -X "PUT" "http://localhost:3000/foods/1" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{
  "allergens": [
    "peanuts"
  ],
  "foodName": "Garden salad"
}'

read -p $'\nReport allergen'
curl -X "POST" "http://localhost:3000/foods/1/allergen" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{
  "allergen": "peanuts",
  "confirm": true
}'

read -p $'\nUn-report allergen'
curl -X "DELETE" "http://localhost:3000/foods/1/allergen" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{
  "allergen": "peanuts"
}'

read -p $'\nLike food'
curl -X "POST" "http://localhost:3000/foods/1/like" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{}'

read -p $'\nUn-like food'
curl -X "DELETE" "http://localhost:3000/foods/1/like" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{}'

read -p $'\nSearch peanut-free salad'
curl "http://localhost:3000/search/salad/peanuts"

read -p $'\nTop searches'
curl "http://localhost:3000/top"

read -p $'\nPopular foods'
curl "http://localhost:3000/popular"

read -p $'\nLatest foods'
curl "http://localhost:3000/latest"

read -p $'\nDelete food'
curl -X "DELETE" "http://localhost:3000/foods/1" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{}'

read -p $'\nDelete menu'
curl -X "DELETE" "http://localhost:3000/menus/1" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{}'

read -p $'\nSuspend user'
curl -X "DELETE" "http://localhost:3000/users/1" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjEsImV4cCI6MTU1MTc1ODg4MjEzMX0.u80jNQx75Q3bT0kvwwhuynRWO9-EqOVKyEjGSRom4es" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{}'

read -p $'\nSuspend user (admin)'
curl -X "DELETE" "http://localhost:3000/users/1" \
     -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOjAsImV4cCI6MTU1MTc1ODk2NDAxMX0.RdcBOYPv1DwXMr1T5z7znje7f_ayFye2KIF6pQ9b7is" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d $'{}'