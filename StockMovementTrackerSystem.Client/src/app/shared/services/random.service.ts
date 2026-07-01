import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RandomService {

  constructor() { }

  /**
   * Generates a random alphanumeric string of the specified length.
   * Contains Number, Capital and Small Letter case
   *
   * @param {number} length - The length of the string to generate.
   * @returns {string} - A random alphanumeric string.
   */
  generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  /**
   * Generates a random alphanumeric string of the specified length.
   * Only Number and Capital Letter
   *
   * @param {number} length - The length of the string to generate.
   * @returns {string} - A random alphanumeric string.
   */
  generateRandomCapitalString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
