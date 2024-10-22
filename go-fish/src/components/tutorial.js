function displayRules() {
    const rules = `
    Welcome to Go Fish!

    Rules:
    1. The game is played with a standard deck of 52 cards.
    2. The objective is to collect the most sets of four matching cards (e.g., four 2s, four Kings, etc.).
    3. Each player is dealt 5 cards (7 cards if there are only two players).
    4. Players take turns asking other players for a specific rank of card. For example, a player might ask, "Do you have any 7s?"
    5. If the player being asked has any cards of that rank, they must give all of them to the asking player. 
    6. If the player does not have any cards of that rank, they say "Go Fish!" The asking player then draws a card from the deck.
    7. If the drawn card is the rank asked for, the player gets another turn. Otherwise, play passes to the next player.
    8. When a player collects four cards of the same rank, they place them face up in front of them.
    9. The game ends when all sets of four have been collected or the deck is empty.
    10. The player with the most sets of four wins the game!

    Have fun playing Go Fish!
    `;
    console.log(rules);
}
