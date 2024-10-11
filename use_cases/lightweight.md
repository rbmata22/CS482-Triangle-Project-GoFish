# Use Case: Process Bets

## Primary Actor:
Player

## Purpose:
Players make bets with virtual currency before the game.

## Stakeholders:
- **Player:** Wants to make bets with their own money and potentially win the pool of bets.
- **Admin:** Wants to ensure that bets are accurate based on how much each individual player places. At the end, the winning player gets rewarded the exact amount the pooled bets make.

## Pre-conditions:
Player has an account with virtual currency.

## Post-conditions:
Bets are placed, and the winning player of a game receives the pooled bets.

## Triggers:
A lobby of players is made, and they start a game of Go Fish.

---

## Basic Flow / Main Success Scenario:

1. **Player logs into their account**  
   The player accesses their account using their username and password.
   
2. **Players join lobby**  
   A game lobby for "Go Fish" is created, and the players join the lobby.
   
3. **Players select their bet amount**  
   Each player chooses the amount of virtual currency they wish to bet.
   
4. **Bet is placed**  
   Once verified, the bet amount is deducted from the player's virtual currency balance.
   
5. **Admin confirms bet**  
   The admin or system automatically confirms that all bets have been placed accurately for all players in the lobby.
   
6. **Game starts**  
   The game of "Go Fish" begins with the pooled bets.
   
7. **Game concludes**  
   After the game ends, the system determines the winning player.
   
8. **Winning player is rewarded**  
   The system automatically transfers the pooled bet amount to the winning player's account.
   
9. **All bets recorded**  
   The system logs the bets and outcome for transparency and record-keeping.

---

## Alternate Flow / Extensions:

### 1a. Player leaves the lobby before betting is finalized:
  - 1a.1: Player selects the option to leave the game lobby.
  - 1a.2: If the player confirms, they are removed from the lobby, and no bets are placed on their behalf.
  - 1a.3: Lobby is updated and notifies remaining players of the player’s exit.

### 1b. Insufficient virtual currency to place the bet:
  - 1b.1: Player attempts to place a bet.
  - 1b.2: Player’s virtual currency balance is checked and found to be insufficient.
  - 1b.3: Admin prompts the player to add more virtual currency or reduce the bet amount.
  - 1b.4: Player either adds more virtual currency or reduces the bet amount. If the player exits without adjusting, then no bet is placed, and the player is removed from betting.
