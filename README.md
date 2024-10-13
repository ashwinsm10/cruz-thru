# Inspiration

One of our team members were previously a Disability Resource Center (DRC) peer notetaker. They realized that there needed to be a self-sufficient and quicker way for DRC students to take notes themselves, allowing for a greater sense of independence. There also needed to be an easier way to create studying tools that required minimal effort from the student.

# What it does

Our accessible app allows for students to record lectures from their phone and transcribe them with the press of a button. Along with a transcription, cohesive lecture notes are taken and flashcards are automatically created to help students get over the hump of challenges that come with learning disabilities.
How we built it

1. React Native - front-end
2. Flask - back-end
3. Google Gemini and OpenAI Whisper - LLMs
- We used Whisper to transcribe audio to text.
- We then used Gemini to create lecture notes from the transcription and flashcards from the lecture notes.

# Challenges we ran into

The main challenge we ran into was sending data from our react app to the flask back-end. We had to work around network issues and we spent a lot of time formatting the data in a way that is usable by other parts of our program. We also spent a lot of time perfecting UI. None of us are graphics designers so we spent many hours researching designs and tweaking ours.

# Accomplishments that we're proud of

We are proud of the high-quality features we were able to implement in a short amount of time. Most importantly, we are proud of our clean UI and how our features are seamlessly implemented into it. We worked very hard to create an app that feels simplistic and easy to use. Creating an app with no barriers is something we are proud of.

# What we learned

We learned how to pick up tools that we weren't familiar with before. None of us had used LLMs in any of our projects and we also had little to no experience using react and flask. We were really only familiar with python and github. We also learned how to time-manage and only proceed with features that were essential. We originally had a huge list of "must-implement" features, but we later realized that we had to prioritize and push off (but not abandon) really cool ideas that might've taken longer.

# What's next for Cruz-Thru: Lectures and Notes

Next up we plan to implement timestamps into our transcription. This makes it easy for students to re-watch parts they missed or find important parts of the lecture. We then plan to solidify the storage system and create an more in-depth history of past transcripts and recordings. Finally, we hope to create a logo and theme that represents an underrepresented part of our community. We don't know what this is yet, but we plan on figuring that out in time.
