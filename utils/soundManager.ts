import { Audio } from 'expo-av';

class SoundManager {
  private loginSuccessSound: Audio.Sound | null = null;
  private sosSound: Audio.Sound | null = null;

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
      // Error loading sounds
    }
  }

  async loadSOSSound() {
    try {
      // Enable audio playback with background capability for SOS
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      // Load SOS button sound
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/SOSBUTTON.mp3'),
        {
          isLooping: true, // Enable looping
          volume: 1.0,
        }
      );
      this.sosSound = sound;
    } catch (error) {
      // Error loading SOS sound
    }
  }

  async playLoginSuccess() {
    try {
      if (this.loginSuccessSound) {
        await this.loginSuccessSound.setPositionAsync(0);
        await this.loginSuccessSound.playAsync();
      }
    } catch (error) {
      // Error playing login success sound
    }
  }

  async playSOSSound() {
    try {
      // Load the sound if not already loaded
      if (!this.sosSound) {
        await this.loadSOSSound();
      }

      if (this.sosSound) {
        await this.sosSound.setPositionAsync(0);
        await this.sosSound.playAsync();
      }
    } catch (error) {
      // Error playing SOS sound
    }
  }

  async stopSOSSound() {
    try {
      if (this.sosSound) {
        await this.sosSound.stopAsync();
        await this.sosSound.unloadAsync();
        this.sosSound = null;
      }
    } catch (error) {
      // Error stopping SOS sound
    }
  }

  async unloadSounds() {
    try {
      if (this.loginSuccessSound) {
        await this.loginSuccessSound.unloadAsync();
        this.loginSuccessSound = null;
      }
      if (this.sosSound) {
        await this.sosSound.stopAsync();
        await this.sosSound.unloadAsync();
        this.sosSound = null;
      }
    } catch (error) {
      // Error unloading sounds
    }
  }
}

export default new SoundManager();
