# **IELTS Speaking Test Assistant**  

This project is a **Flask-based web application** that provides **real-time conversation assessment** for IELTS speaking test candidates. It evaluates **pronunciation, grammar, and lexical resources**, offering **personalized feedback** and **IELTS band score predictions** using **Azure Cognitive Services** and **OpenAI GPT models**.

---

## **Features**  

✅ **Speech-to-Text Conversion:** Uses **Azure OpenAI Whisper API** for **high-accuracy transcription**.  
✅ **Chat-based Interaction:** Engages users in conversation and provides **contextual responses** using **GPT-4o**.  
✅ **Pronunciation Assessment:** Evaluates **pronunciation accuracy** using **Azure Speech SDK**.  
✅ **IELTS Band Score Prediction:** Generates an **estimated IELTS band score** based on pronunciation and lexical resource evaluation.  
✅ **Text-to-Speech (TTS):** Converts responses into **natural-sounding speech** using **Azure TTS**.  
✅ **Audio Playback & Download:** Allows users to **review and download their speech recordings**.  

---

## **Tech Stack**  

- **Python** (Flask, Requests, Pydub)  
- **Azure Cognitive Services** (Speech-to-Text, Text-to-Speech, Pronunciation Assessment)  
- **Azure OpenAI GPT-4o**  
- **Flask API**  
- **HTML/CSS/JavaScript (Frontend)**  
- **Postman** (For API testing)  

---

## **Setup & Installation**  

### **Prerequisites**  
1. **Python 3.8+** installed  
2. **Azure Subscription** (for Speech Services & OpenAI API)  
3. **Environment Variables (.env file):**  
   ```
   SUBSCRIPTION_KEY=your_azure_subscription_key
   OPENAI_API=your_openai_api_key
   WHISPER_API_KEY=your_whisper_api_key
   ```

### **Installation Steps**  

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/your-repo/ielts-speaking-assistant.git
   cd ielts-speaking-assistant
   ```

2. **Install Dependencies**  
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Application**  
   ```bash
   python app.py
   ```
   The server will start at **http://127.0.0.1:5000/**.

---

## **API Endpoints**  

### 🎤 **Speech Processing**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/gettoken` | `POST` | Fetches Azure Speech Service token |
| `/get-topic` | `GET` | Returns a random IELTS speaking topic |
| `/converse` | `POST` | Processes user audio & returns AI-generated response |
| `/start-conversation` | `POST` | Resets conversation state |
| `/stop-conversation` | `POST` | Returns final pronunciation & IELTS score |
| `/get-audio` | `GET` | Retrieves the full conversation audio |
| `/get-transcript` | `POST` | Transcribes user speech & appends to history |
| `/get-assistant-response` | `POST` | Generates AI response based on conversation history |

### 🔊 **Text-to-Speech (TTS)**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/gettts` | `POST` | Converts text to speech |
| `/getttsforword` | `POST` | Provides pronunciation for a single word |

---

## **How It Works**  

1️⃣ **User records an audio file** (speech response).  
2️⃣ The **Whisper API** transcribes the speech into text.  
3️⃣ **GPT-4o** generates a **contextual AI response** to continue the conversation.  
4️⃣ The **pronunciation is assessed** using Azure Speech SDK.  
5️⃣ A final **IELTS band score is predicted** based on **pronunciation & grammar evaluation**.  
6️⃣ The conversation **audio and transcript** can be **retrieved & downloaded**.  

---



🚀 **Enhance your IELTS Speaking Skills with AI-Powered Feedback!** 🎙️
