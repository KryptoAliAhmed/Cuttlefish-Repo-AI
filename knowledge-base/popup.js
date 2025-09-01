document.getElementById('save').addEventListener('click', () => {
  chrome.storage.local.set({ greeting: "Hello from Cuttlefish!" }, () => {
    document.getElementById('output').textContent = 'Greeting saved!';
  });
});

document.getElementById('load').addEventListener('click', () => {
  chrome.storage.local.get('greeting', (data) => {
    document.getElementById('output').textContent = data.greeting || 'Nothing saved yet.';
  });
});