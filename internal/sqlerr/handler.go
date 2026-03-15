package sqlerr

import (
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/rafidoth/onlyexams/internal/errs"
)

// ConvertPgError converts a *pgconn.PgError into our custom *Error type,
// mapping the SQLSTATE code and severity to structured values.
func ConvertPgError(src *pgconn.PgError) *Error {
	return &Error{
		Code:           MapCode(src.Code),
		Severity:       MapSeverity(src.Severity),
		DatabaseCode:   src.Code,
		Message:        src.Message,
		SchemaName:     src.SchemaName,
		TableName:      src.TableName,
		ColumnName:     src.ColumnName,
		DataTypeName:   src.DataTypeName,
		ConstraintName: src.ConstraintName,
		driverErr:      src,
	}
}

// HandleError converts a database error into an appropriate *errs.HTTPError.
// If the error is nil, it returns nil.
// If the error is pgx.ErrNoRows, it returns a 404 Not Found.
// If the error is a *pgconn.PgError, it converts it to a structured error.
// Otherwise, it returns a 500 Internal Server Error.
func HandleError(err error) error {
	if err == nil {
		return nil
	}

	// No rows found → 404
	if errors.Is(err, pgx.ErrNoRows) {
		return errs.NewNotFoundError("The requested resource was not found", false, nil)
	}

	// PostgreSQL-specific error
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		sqlErr := ConvertPgError(pgErr)
		return mapSqlErrToHTTP(sqlErr)
	}

	// Unknown database error → 500
	return errs.NewInternalServerError()
}

// mapSqlErrToHTTP maps a structured *Error to an *errs.HTTPError based on the
// error code and severity.
func mapSqlErrToHTTP(e *Error) *errs.HTTPError {
	code := generateErrorCode(e)
	message := formatUserFriendlyMessage(e)

	switch e.Code {
	case UniqueViolation:
		return errs.NewBadRequestError(message, false, &code, nil, nil)

	case ForeignKeyViolation:
		return errs.NewBadRequestError(message, false, &code, nil, nil)

	case NotNullViolation:
		field := humanizeText(e.ColumnName)
		fieldErrors := []errs.FieldError{
			{Field: e.ColumnName, Error: fmt.Sprintf("%s is required", field)},
		}
		return errs.NewBadRequestError(message, false, &code, fieldErrors, nil)

	case CheckViolation:
		return errs.NewBadRequestError(message, false, &code, nil, nil)

	case ExcludeViolation:
		return errs.NewBadRequestError(message, false, &code, nil, nil)

	case DeadlockDetected:
		return &errs.HTTPError{
			Code:    code,
			Message: "A conflict occurred. Please try again.",
			Status:  http.StatusConflict,
		}

	case TooManyConnections:
		return &errs.HTTPError{
			Code:    code,
			Message: "The service is temporarily overloaded. Please try again later.",
			Status:  http.StatusServiceUnavailable,
		}

	case TransactionFailed:
		return errs.NewInternalServerError()

	default:
		// Severity-based fallback
		switch e.Severity {
		case SeverityFatal, SeverityPanic:
			return errs.NewInternalServerError()
		default:
			return errs.NewInternalServerError()
		}
	}
}

// generateErrorCode creates an error code string from the error's constraint,
// table, or SQLSTATE code for use in API responses.
func generateErrorCode(e *Error) string {
	if e.ConstraintName != "" {
		return errs.MakeUpperCaseWithUnderscores(e.ConstraintName)
	}
	if e.TableName != "" {
		return fmt.Sprintf("%s_%s", strings.ToUpper(e.TableName), strings.ToUpper(string(e.Code)))
	}
	return fmt.Sprintf("DB_%s", e.DatabaseCode)
}

// formatUserFriendlyMessage creates a human-readable error message based on
// the error type.
func formatUserFriendlyMessage(e *Error) string {
	entity := getEntityName(e)

	switch e.Code {
	case UniqueViolation:
		column := extractColumnForUniqueViolation(e)
		if column != "" {
			return fmt.Sprintf("A %s with this %s already exists", entity, humanizeText(column))
		}
		return fmt.Sprintf("A %s with these details already exists", entity)

	case ForeignKeyViolation:
		return fmt.Sprintf("The referenced %s does not exist or cannot be used", entity)

	case NotNullViolation:
		if e.ColumnName != "" {
			return fmt.Sprintf("%s is required", humanizeText(e.ColumnName))
		}
		return "A required field is missing"

	case CheckViolation:
		return fmt.Sprintf("The provided value for %s is not valid", entity)

	case ExcludeViolation:
		return fmt.Sprintf("This %s conflicts with an existing record", entity)

	default:
		return "An unexpected database error occurred"
	}
}

// getEntityName extracts a human-friendly entity name from the error's table
// name, falling back to "resource" if unavailable.
func getEntityName(e *Error) string {
	if e.TableName != "" {
		name := e.TableName
		// Remove common suffixes like "_table"
		name = strings.TrimSuffix(name, "_table")
		// Singularize simple plurals (remove trailing 's')
		if strings.HasSuffix(name, "s") && !strings.HasSuffix(name, "ss") {
			name = strings.TrimSuffix(name, "s")
		}
		return humanizeText(name)
	}
	return "resource"
}

// humanizeText converts a snake_case string into a human-readable form.
// e.g. "user_email" → "user email"
func humanizeText(s string) string {
	return strings.ReplaceAll(s, "_", " ")
}

// extractColumnForUniqueViolation attempts to extract the column name involved
// in a unique constraint violation. It first checks the ColumnName field, then
// tries to parse it from the constraint name.
func extractColumnForUniqueViolation(e *Error) string {
	if e.ColumnName != "" {
		return e.ColumnName
	}

	// Try to extract from constraint name patterns like "tablename_columnname_key"
	// or "idx_tablename_columnname"
	if e.ConstraintName != "" {
		// Pattern: tablename_columnname_key
		re := regexp.MustCompile(`^[a-z_]+?_(.+?)_key$`)
		if matches := re.FindStringSubmatch(e.ConstraintName); len(matches) > 1 {
			return matches[1]
		}
		// Pattern: idx_tablename_columnname
		re = regexp.MustCompile(`^idx_[a-z_]+?_(.+?)$`)
		if matches := re.FindStringSubmatch(e.ConstraintName); len(matches) > 1 {
			return matches[1]
		}
	}

	return ""
}
