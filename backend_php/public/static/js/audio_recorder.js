/**
 * Browser Web Audio & MediaRecorder Module for User Recitations
 */
const AudioRecorder = (() => {
  let mediaRecorder = null;
  let audioChunks = [];
  let recordedBlob = null;
  let recordedUrl = null;
  let startTime = 0;
  let timerInterval = null;

  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Audio recording is not supported in this browser environment.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    recordedBlob = null;
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      recordedUrl = null;
    }

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
      recordedUrl = URL.createObjectURL(recordedBlob);
      // Stop all tracks to release mic
      stream.getTracks().forEach(t => t.stop());
    };

    mediaRecorder.start();
    startTime = Date.now();
  }

  function stop() {
    return new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      mediaRecorder.addEventListener('stop', () => {
        const duration = (Date.now() - startTime) / 1000;
        resolve({
          blob: recordedBlob,
          url: recordedUrl,
          duration: duration
        });
      }, { once: true });
      mediaRecorder.stop();
    });
  }

  async function upload(ayahId, durationSeconds) {
    if (!recordedBlob) {
      throw new Error("No recorded audio found to upload.");
    }
    const formData = new FormData();
    formData.append('audio', recordedBlob, `recitation_${ayahId || 'practice'}.webm`);
    if (ayahId) formData.append('ayah_id', ayahId);
    if (durationSeconds) formData.append('duration_seconds', durationSeconds);

    return await API.audio.uploadRecording(formData);
  }

  return {
    start,
    stop,
    upload,
    getRecordedUrl: () => recordedUrl,
    isRecording: () => mediaRecorder && mediaRecorder.state === 'recording'
  };
})();
