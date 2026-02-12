from database import fetch_one

def s(v):
    """Convert value to string, empty string if None"""
    return "" if v is None else str(v).strip()

def is_blank(v):
    """Check if value is None or empty string"""
    return s(v) == ""

def require(errors, value, message):
    """Check if required field has value"""
    if is_blank(value):
        errors.append(message)
        return False
    return True

def int_field(errors, value, name, *, min_value=None, max_value=None, required=False):
    """Validate and convert integer field"""
    if is_blank(value):
        if required:
            errors.append(f"{name} is required")
        return None
    try:
        n = int(float(s(value)))
        if min_value is not None and n < min_value:
            errors.append(f"{name} must be >= {min_value}")
        if max_value is not None and n > max_value:
            errors.append(f"{name} must be <= {max_value}")
        return n
    except Exception:
        errors.append(f"{name} must be an integer")
        return None

def float_field(errors, value, name, *, min_value=None, max_value=None, required=False):
    """Validate and convert float field"""
    if is_blank(value):
        if required:
            errors.append(f"{name} is required")
        return None
    try:
        n = float(s(value))
        if min_value is not None and n < min_value:
            errors.append(f"{name} must be >= {min_value}")
        if max_value is not None and n > max_value:
            errors.append(f"{name} must be <= {max_value}")
        return n
    except Exception:
        errors.append(f"{name} must be a number")
        return None

def bool01(errors, value, name, *, required=False):
    """Validate 0/1 boolean field"""
    return int_field(errors, value, name, min_value=0, max_value=1, required=required)

def str_field(errors, value, name, *, max_length=None, required=False):
    """Validate string field"""
    val = s(value)
    if is_blank(val):
        if required:
            errors.append(f"{name} is required")
        return None
    if max_length and len(val) > max_length:
        errors.append(f"{name} must be {max_length} characters or less")
    return val

def fk_exists(errors, value, name, table, column):
    """Check if foreign key exists"""
    if is_blank(value):
        return True
    if not fetch_one(f"SELECT {column} FROM {table} WHERE {column} = %s", (s(value),)):
        errors.append(f"{name} '{s(value)}' does not exist")
        return False
    return True

def enum_field(errors, value, name, valid_values, *, required=False):
    """Validate enum/choice field"""
    val = s(value)
    if is_blank(val):
        if required:
            errors.append(f"{name} is required")
        return None
    if val not in valid_values:
        errors.append(f"{name} must be one of: {', '.join(valid_values)}")
        return None
    return val