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
      console.error('Error loading sounds:', error);
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
      console.error('Error loading SOS sound:', error);
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

  async playSOSSound() {
    try {
      // Load the sound if not already loaded
      if (!this.sosSound) {
        await this.loadSOSSound();
      }

      if (this.sosSound) {
        await this.sosSound.setPositionAsync(0);
        await this.sosSound.playAsync();
        console.log('SOS sound started playing (looping)');
      }
    } catch (error) {
      console.error('Error playing SOS sound:', error);
    }
  }

  async stopSOSSound() {
    try {
      if (this.sosSound) {
        await this.sosSound.stopAsync();
        await this.sosSound.unloadAsync();
        this.sosSound = null;
        console.log('SOS sound stopped and unloaded');
      }
    } catch (error) {
      console.error('Error stopping SOS sound:', error);
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
      console.error('Error unloading sounds:', error);
    }
  }
}

export default new SoundManager();
