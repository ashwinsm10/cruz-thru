import streamlit as st

import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key="AIzaSyDK2wVNgSe9i3hRz4jJxf6rl370wYBFDpw")


def fetch_transcript():
    file_path = 'transcript.txt'

    with open(file_path, 'r') as file:
        string = file.read()
        print(string[0])
    return string


def generate_notes(transcript_text):
    prompt = """
        Title: Detailed Physics Notes from YouTube Video Transcript

        As a physics expert, your task is to provide detailed notes based on the transcript of a YouTube video I'll provide. Assume the role of a student and generate comprehensive notes covering the key concepts discussed in the video.

        Your notes should:

        - Highlight fundamental principles, laws, and theories discussed in the video.
        - Explain any relevant experiments, demonstrations, or real-world applications.
        - Clarify any mathematical equations or formulas introduced and provide explanations for their significance.
        - Use diagrams, illustrations, or examples to enhance understanding where necessary.

        Please provide the YouTube video transcript, and I'll generate the detailed physics notes accordingly.
    """

    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt + transcript_text)
    return response.text

def main():


    st.title("YouTube Transcript to Detailed Notes Converter")
    

    subject = st.selectbox("Select Subject:", ["Physics", "Chemistry", "Mathematics", "Data Science and Statistics"])

    if st.button("Get Detailed Notes"):
        # Call function to extract transcript
        transcript_text = fetch_transcript()
        
        if transcript_text:
            st.success("Transcript extracted successfully!")
            # Generate detailed notes
            detailed_notes = generate_notes(transcript_text, subject)
            st.markdown("## Detailed Notes:")
            st.write(detailed_notes)
        else:
            st.error("Failed to extract transcript.")

if __name__ == "__main__":
    main()