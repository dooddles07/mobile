import { Audio } from 'expo-av';

class SoundManager {
  private loginSuccessSound: Audio.Sound | null = null;

  async loadSounds() {
    try {
      // Enable audio playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Load login success sound
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/Welcome.mp3')
      );
      this.loginSuccessSound = sound;
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  }

  async playLoginSuccess() {
    try {
      if (this.loginSuccessSound) {
        await this.loginSuccessSound.setPositionAsync(0);
        await this.loginSuccessSound.playAsync();
      }
    } catch (error) {
      console.error('Error playing login success sound:', error);
    }
  }

  async unloadSounds() {
    try {
      if (this.loginSuccessSound) {
        await this.loginSuccessSound.unloadAsync();
        this.loginSuccessSound = null;
      }
    } catch (error) {
      console.error('Error unloading sounds:', error);
    }
  }
}

export default new SoundManager();
