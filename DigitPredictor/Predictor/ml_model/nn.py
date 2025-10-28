import torch
import torch.nn as nn
import torch.nn.functional as F


class NeuralNetwork(nn.Module):
    def __init__(self):
        super().__init__()

        self.cnv1 = nn.Conv2d(1, 32, kernel_size = 3, padding = 1)
        self.cnv2 = nn.Conv2d(32, 64, kernel_size = 3, padding = 1)

        self.pool = nn.MaxPool2d(2, 2)

        self.fc1 = nn.Linear(64 * 7 * 7, 128)
        self.fc2 = nn.Linear(128, 10)

        self.drop = nn.Dropout(0.3)

    def forward(self, x):
        x = self.pool(F.relu(self.cnv1(x)))
        x = self.pool(F.relu(self.cnv2(x)))

        x = torch.flatten(x, 1)

        x = F.relu(self.fc1(x))
        x = self.drop(x)
        x = self.fc2(x)

        return x

