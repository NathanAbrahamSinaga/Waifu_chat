<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  let messages = [];
  let inputMessage = '';
  let audio;
  let ws;

  onMount(() => {
    if (browser) {
      audio = new Audio();
      connectWebSocket();
    }
  });

  onDestroy(() => {
    if (ws) {
      ws.close();
    }
  });

  function connectWebSocket() {
    const wsUrl = import.meta.env.PROD 
      ? 'wss://waifu-chat-api.vercel.app/'
      : 'ws://localhost:3000';
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      loadMessages();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        messages = data.messages;
      } else if (data.type === 'error') {
        console.error('Server error:', data.message);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(connectWebSocket, 5000);
    };
  }

  function loadMessages() {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'get-messages' }));
    }
  }

  function sendMessage() {
    if (inputMessage.trim() === '') return;

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'chat', message: inputMessage }));
      inputMessage = '';
    } else {
      console.error('WebSocket is not connected');
    }
  }

  function playAudio(audioUrl) {
    if (browser && audioUrl) {
      audio.src = audioUrl;
      audio.play();
    }
  }

  function clearChat() {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'clear-chat' }));
    } else {
      console.error('WebSocket is not connected');
    }
  }
</script>

<div class="flex flex-col h-full bg-black bg-opacity-50 rounded-lg">
  <div class="flex justify-between items-center p-4 border-b border-gray-600">
    <h2 class="text-xl font-bold text-white">Chat</h2>
    <button on:click={clearChat} class="bg-red-500 bg-opacity-75 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200">New</button>
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
            <button on:click={() => playAudio(message.audio_url)} class="text-sm text-blue-300 hover:text-blue-400 transition-colors duration-200">Play Audio</button>
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
      <button type="submit" class="bg-blue-500 bg-opacity-75 text-white p-2 rounded-r-lg hover:bg-blue-700 transition-colors duration-200">Send</button>
    </form>
  </div>
</div>