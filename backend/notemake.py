import streamlit as st

import google.generativeai as genai

genai.configure(api_key="AIzaSyDgf0MUkoQDvVWc3VNFvq104JCmBtdaOys")


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