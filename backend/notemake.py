import streamlit as st

import google.generativeai as genai

genai.configure(api_key="API_KEY")


def generate_notes(transcript_text):
    prompt = """
        Title: Detailed Notes from Lecture Transcript

        As a notetaker, your job is to take comprehensive notes from the transcript that I will be providing to you. 
        Your notes should:

        - Highlight fundamental principles, laws, and theories discussed in the transcript.
        - Highlight key dates and important events discussed.
        - Explain any relevant experiments, demonstrations, or real-world applications.
        - Clarify any mathematical equations or formulas introduced and provide explanations for their significance.
        - Use examples to enhance understanding where necessary.

        Please provide the written transcript, and I'll generate the detailed notes accordingly.
    """

    model = genai.GenerativeModel('gemini-1.5-flash')

    response = model.generate_content(prompt + transcript_text)

    print(response.text)
    return response.text

def generate_flashcards(notes_text):
    prompt = """
        Title: Flashcards from Lecture Notes

        Create flashcards in the format: vocabulary ^ definition. Don't add any extra text.
        The source given to you are lecture notes. Make sure to include any key terms, important dates, and equations if present in the lecture notes.

    """

    model = genai.GenerativeModel('gemini-1.5-flash')
    

    response = model.generate_content(prompt + notes_text)
    
    data = []
    for line in response.text.splitlines():
        try:
            vocab, answer = line.split(' ^ ')
        except:
            data.append({'vocab': "", 'answer': ""})
            return data
        data.append({'vocab': vocab, 'answer': answer})


    return data


def answer_question(notes_text, user_question):
    prompt = f"""
    I have the following notes from a lecture transcript:

    {notes_text}

    Now, answer the following question based on these notes:
    
    Question: {user_question}
    
    Provide a simple answer using the notes as reference.
    """

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    response = model.generate_content(prompt)

    return response.text

