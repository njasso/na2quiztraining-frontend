export const useLocalContent = (type) => {
  const [content, setContent] = useState([]);

  useEffect(() => {
    const key = type === 'quiz' ? 'localQuizzes' : 'localExams';
    const storedData = JSON.parse(localStorage.getItem(key)) || [];
    setContent(storedData);
  }, [type]);

  return content;
};