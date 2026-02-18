import { useState, useEffect } from 'react';
import styles from './SchoolAutocomplete.module.css';

export default function SchoolAutocomplete({ value, onChange, required }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidSchool, setIsValidSchool] = useState(true);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  // 高校リストを取得
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/fukuoka-hbf/schools');
        const data = await response.json();
        if (data.success) {
          setSchools(data.schools);
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // 1文字以上入力されたらサジェスト表示（名前またはかなで検索）
    if (newValue.length >= 1) {
      const filtered = schools.filter(school =>
        school.name.includes(newValue) || school.kana.includes(newValue)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);

      // リストにない学校は無効
      const isValid = schools.some(school => school.name === newValue);
      setIsValidSchool(isValid);

      // 有効な学校名のみ親に通知
      if (isValid) {
        onChange(newValue);
      } else {
        onChange('');
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsValidSchool(false);
      onChange('');
    }
  };

  const handleSuggestionClick = (schoolName) => {
    setInputValue(schoolName);
    setIsValidSchool(true);
    setShowSuggestions(false);
    onChange(schoolName);
  };

  const handleBlur = () => {
    // 少し遅延させてクリックイベントを処理できるようにする
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className={styles.autocompleteContainer}>
      <input
        type="text"
        className={`${styles.input} ${!isValidSchool && inputValue.length >= 2 ? styles.invalid : ''}`}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => {
          if (inputValue.length >= 1 && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={loading ? '読み込み中...' : '学校名を入力してください（1文字以上）'}
        required={required}
        disabled={loading}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {suggestions.map((school, index) => (
            <li
              key={index}
              className={styles.suggestionItem}
              onClick={() => handleSuggestionClick(school.name)}
            >
              {school.name}
            </li>
          ))}
        </ul>
      )}
      {inputValue.length >= 1 && suggestions.length === 0 && (
        <p className={styles.errorText}>該当する学校が見つかりません</p>
      )}
    </div>
  );
}
