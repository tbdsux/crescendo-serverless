const picker = new EmojiButton({
  position: 'bottom-start',
})
const trigger = document.querySelector('#trigger-emote')
const textarea = document.querySelector('#post-content')

picker.on('emoji', (selection) => {
  // add the emoji to the textarea
  textarea.value += selection
})

trigger.onclick = () => picker.togglePicker(trigger)
