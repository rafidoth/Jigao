package questionsModels

type ChoicesWithQuestionType struct {
	Choices      []Choice
	QuestionType string
	QuestionId   string
}

type AnswerWithQuestionInfo struct {
	AnswerText   string
	Explanation  string
	QuestionType string
	QuestionId   string
}
