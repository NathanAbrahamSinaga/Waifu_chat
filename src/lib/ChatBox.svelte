<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
  
    let messages = [];
    let inputMessage = '';
    let audio;
  
    onMount(() => {
      if (browser) {
        audio = new Audio();
      }
      loadMessages();
    });
  
    async function loadMessages() {
      const response = await fetch('http://localhost:3000/api/messages');
      messages = await response.json();
    }
  
    async function sendMessage() {
      if (inputMessage.trim() === '') return;
  
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });
  
      const data = await response.json();
      messages = [...messages, { sender: 'user', content: inputMessage }, { sender: 'ai', content: data.message, content_jp: data.translation, audio_url: data.audioUrl }];
      inputMessage = '';
  
      if (browser && data.audioUrl) {
        audio.src = data.audioUrl;
        audio.play();
      }
    }
  
    function playAudio(audioUrl) {
      if (browser && audioUrl) {
        audio.src = audioUrl;
        audio.play();
      }
    }
  
    // Add this new function to clear the chat
    async function clearChat() {
      const response = await fetch('http://localhost:3000/api/clear-chat', {
        method: 'POST',
      });
  
      if (response.ok) {
        messages = [];
      } else {
        console.error('Failed to clear chat');
      }
    }
  </script>
  
  <div class="flex flex-col h-full bg-black bg-opacity-50 rounded-lg">
    <div class="flex justify-between items-center p-4 border-b border-gray-600">
      <h2 class="text-xl font-bold text-white">Chat</h2>
      <button on:click={clearChat} class="bg-red-500 bg-opacity-75 text-white px-4 py-2 rounded-lg">New</button>
    </div>
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      {#each messages as message}
        <div class={message.sender === 'user' ? 'text-right' : 'text-left'}>
          <div class={`inline-block p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 bg-opacity-75 text-white' : 'bg-gray-200 bg-opacity-75'}`}>
            {message.content}
            {#if message.content_jp}
              <div class="text-sm text-gray-500">{message.content_jp}</div>
            {/if}
            {#if message.audio_url}
              <button on:click={() => playAudio(message.audio_url)} class="text-sm text-blue-300">Play Audio</button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
    <div class="p-4 border-t border-gray-600">
      <form on:submit|preventDefault={sendMessage} class="flex">
        <input
          type="text"
          bind:value={inputMessage}
          placeholder="Type your message..."
          class="flex-1 border rounded-l-lg p-2 bg-gray-800 bg-opacity-75 text-white placeholder-gray-400"
        />
        <button type="submit" class="bg-blue-500 bg-opacity-75 text-white p-2 rounded-r-lg">Send</button>
      </form>
    </div>
  </div>