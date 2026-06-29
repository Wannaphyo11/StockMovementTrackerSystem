using System.Security.Cryptography;

namespace StockMovementTrackerSystem.Application.Interfaces;

public interface IEncryptionService
{
    CryptoStream EncryptStream(Stream responseStream);

    byte[] Encrypt(string plainText);

    CryptoStream DecryptStream(Stream cipherStream);

    string DecryptString(string cipherText);
}
