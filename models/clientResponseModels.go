package models

type CompleteQuestion struct {
	Id                string   `json:"id"`
	Question          string   `json:"text"`
	QuestionType      string   `json:"type"`
	Difficulty        string   `json:"difficulty"`
	Position          int      `json:"position"`
	Choices           []string `json:"choices"`
	Answer            string   `json:"answer"`
	AnswerChoiceIndex int8     `json:"answerIdx"`
	Explanation       string   `json:"explanation"`
}

func NewCompleteQuestion(
	Q Question,
	c []Choice,
	a Answer,
) CompleteQuestion {
	choices := make([]string, len(c))
	var answerChoiceIndex int8
	for i, choice := range c {
		choices[i] = choice.ChoiceText
		if choice.Id == a.ChoiceId {
			answerChoiceIndex = int8(i)
		}
	}

	return CompleteQuestion{
		Id:                Q.Id,
		Question:          Q.Question,
		QuestionType:      Q.QuestionType,
		Difficulty:        Q.Difficulty,
		Position:          int(Q.Position),
		Answer:            a.AnswerText,
		Choices:           choices,
		AnswerChoiceIndex: answerChoiceIndex,
		Explanation:       a.Explanation,
	}
}
