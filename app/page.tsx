'use client';

import { Brain, BrainCogIcon, Clock, PlayIcon, Star, Target, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// クイズの題の型
interface Question {
  id: number;
  question: string;
  answers: string[];
  correctAnswer: number;
  difficulty: Difficulty;
  explanation: string;
}

// ユーザーの回答履歴の型定義
interface UserAnswer {
  question: string;
  userAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  timeSpent?: number;

}

// ゲームの進行状態
type GameState = 'menu' | 'playing' | 'result';
// カテゴリ
type Category = 'general' | 'tech';
// 難易度
type Difficulty = 'easy' | 'normal' | 'hard';

export default function Home() {
  // ゲーム状態管理
  const [gameState, setGameState] = useState<GameState>('menu');
  // カテゴリ管理
  const [category, setCategory] = useState<Category>('general');
  // 難易度管理
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  // クイズ数管理
  const [questionCount, setQuestionCount] = useState<number>(10);
  // 現在のクイズ問題番号管理
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  // 選択した回答管理
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  // 回答済みかどうかの管理
  const [answered, setAnswered] = useState<boolean>(false);
  // タイマーID管理
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // スコア管理
  const [score, setScore] = useState<number>(0);
  // ユーザーの回答履歴管理
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  // 経過時間管理
  const [timeLeft, setTimeLeft] = useState<number>(10);
  // マウント状態管理
  const [mounted, setMounted] = useState(false);

  // 初期マウント時に状態をセット
  useEffect(() => {
    setMounted(true);
  }, []);

  // カテゴリ別問題
  const quizData: Record<Category, Question[]> = {
    general: [
      {
        id: 1,
        question: "日本の首都はどこですか？",
        answers: ["大阪", "東京", "京都", "名古屋"],
        correctAnswer: 1,
        difficulty: "easy",
        explanation: "日本の首都は東京です。1868年に江戸から東京に改称されました。"
      },
      {
        id: 2,
        question: "地球で最も高い山は何ですか？",
        answers: ["富士山", "キリマンジャロ", "エベレスト", "マッターホルン"],
        correctAnswer: 2,
        difficulty: "easy",
        explanation: "エベレストは標高8,848mで世界最高峰です。"
      },
      {
        id: 3,
        question: "太陽系で最も大きな惑星は？",
        answers: ["土星", "木星", "海王星", "地球"],
        correctAnswer: 1,
        difficulty: "normal",
        explanation: "木星は太陽系最大の惑星で、地球の約11倍の直径があります。"
      },
      {
        id: 4,
        question: "光の速度は約何km/秒ですか？",
        answers: ["30万", "3万", "300万", "3000万"],
        correctAnswer: 0,
        difficulty: "normal",
        explanation: "光の速度は約30万km/秒（正確には299,792,458m/秒）です。"
      },
      {
        id: 5,
        question: "DNAの二重らせん構造を発見したのは誰ですか？",
        answers: ["メンデル", "ダーウィン", "ワトソンとクリック", "パスツール"],
        correctAnswer: 2,
        difficulty: "hard",
        explanation: "1953年にジェームズ・ワトソンとフランシス・クリックがDNAの二重らせん構造を発見しました。"
      }
    ],
    tech: [
      {
        id: 6,
        question: "HTMLの正式名称は？",
        answers: ["HyperText Markup Language", "Home Tool Markup Language", "Hyperlink Text Management Language", "High Tech Modern Language"],
        correctAnswer: 0,
        difficulty: "easy",
        explanation: "HTMLはHyperText Markup Languageの略で、ウェブページを作成するためのマークアップ言語です。"
      },
      {
        id: 7,
        question: "JavaScriptで変数を宣言するキーワードは？",
        answers: ["variable", "var", "declare", "set"],
        correctAnswer: 1,
        difficulty: "easy",
        explanation: "JavaScriptでは var, let, const を使って変数を宣言できます。"
      },
      {
        id: 8,
        question: "CSSでボックスの外側の余白を指定するプロパティは？",
        answers: ["padding", "margin", "border", "spacing"],
        correctAnswer: 1,
        difficulty: "normal",
        explanation: "marginは要素の外側の余白を指定し、paddingは内側の余白を指定します。"
      },
      {
        id: 9,
        question: "Reactで状態管理に使用するHookは？",
        answers: ["useEffect", "useState", "useContext", "useRef"],
        correctAnswer: 1,
        difficulty: "normal",
        explanation: "useStateはReactで最も基本的な状態管理Hookです。"
      },
      {
        id: 10,
        question: "HTTPSの「S」は何を表しますか？",
        answers: ["Server", "Security", "Secure", "System"],
        correctAnswer: 2,
        difficulty: "hard",
        explanation: "HTTPSのSはSecureを表し、SSL/TLSによって暗号化された安全な通信を意味します。"
      }
    ]
  }

  // 状態監視
  // カウントダウンタイマー
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if(gameState === 'playing' && selectedAnswer === null){
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0; // タイマーが0以下にならないように
          }
          return prev - 1;
        });
      }, 1000);

      return () =>{
        if(timer){
          clearInterval(timer);
        }
      };
    }
  }, [gameState, currentQuestionIndex]);

  // 時間切れ処理
  useEffect(() => {
    if(timeLeft <= 0 && gameState === 'playing' && selectedAnswer === null){
      handleAnswerSelect(null); // 回答なしで次の問題へ
    }
  }, [timeLeft, gameState]);
  
  // 現在の問題を取得
  const getCurrentQuestions = (): Question[] => {
    const questions = quizData[category];
    return questions
      .filter((q) => q.difficulty === difficulty)
      .slice(0, questionCount);
  }

  // 次の問題に遷移
  const moveToNextQuestion = (): void => {
    // 次の問題番号をセット
    setCurrentQuestionIndex(prev => prev + 1);
    // 回答済みフラグをリセット
    setAnswered(false);
    // 選択した回答をリセット
    setSelectedAnswer(null);
    // タイマーをリセット
    setTimeLeft(getDifficultyTimeLimit());
  }

  // 問題のカテゴリをセット
  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setCategory(event.target.value as Category);
  }

  // 問題の難易度をセット
  const handleDifficultyChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setDifficulty(event.target.value as Difficulty);
  }

  // 問題数をセット
  const handleQuestionCountChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setQuestionCount(Number(event.target.value));
  }

  // #region 次の問題をセットする
  const handleAnswerSelect = (answerIndex: number | null): void => {

    // 回答済みの場合は何もしない
    if(answered == true){
      return;
    }

    // 回答済みフラグをセット
    setAnswered(true);
    // 選択した回答をセット
    setSelectedAnswer(answerIndex);

    // タイマーをクリア
    if(timeoutRef.current){
      clearTimeout(timeoutRef.current)
    }

    // 正解判定とスコア更新
    const questions = getCurrentQuestions();
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;

    // 正解の場合、得点を加算
    if(isCorrect) {
      setScore(prev => prev + 1);
    }

    // 回答履歴に追加
    setUserAnswers(prev => [...prev, {
      question: currentQuestion.question,
      userAnswer: answerIndex,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect
    }])

    timeoutRef.current = setTimeout(() => {
      const questions = getCurrentQuestions();

      if(currentQuestionIndex + 1 >= questions.length){
        // 最後の問題の場合、結果画面へ
        setGameState('result');
        // 現在の問題番号をリセット
        setCurrentQuestionIndex(0);
      }else{
        // 次の問題へ
        moveToNextQuestion();
      }

      timeoutRef.current = null;  // タイマーIDをクリア
    }, 2000)
  }
  // #endregion

  // ホーム画面に戻る
  const goToHome = (): void => {

    // ゲーム状態をリセット
    resetGameState();

    // 状態を初期化
    setGameState('menu');

    // 初期状態に戻す
    setCategory('general');

    // 難易度を初期化
    setDifficulty('normal');

    // 問題数を初期化
    setQuestionCount(10);

  }

  // 各種状態管理を初期化
  const resetGameState = (): void => {
    
    // タイマーをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 問題のインデックスを初期化
    setCurrentQuestionIndex(0);

    // 解答済みフラグを初期化
    setAnswered(false);

    // 選択した回答を初期化
    setSelectedAnswer(null);

    // スコアを初期化
    setScore(0);

    // ユーザの解答履歴を初期化
    setUserAnswers([]);

    // タイマーを初期化
    setTimeLeft(getDifficultyTimeLimit());

  }

  // ゲーム開始
  const startGame = (): void => {

    // ゲーム状態を初期化
    resetGameState();
    
    // ゲーム状態を「playing」に変更
    setGameState('playing');
  
  };

  // 難易度に応じたタイマーを設定
  const getDifficultyTimeLimit = (): number => {
    switch (difficulty) {
      case 'easy':
        return 15; // 簡単は15秒
      case 'normal':
        return 1000; // 普通は10秒
      case 'hard':
        return 7; // 難しいは7秒
      default:
        return 10; // デフォルトは10秒
    }
  }

  // メニュー画面からリザルト画面まで
  const renderContent = () => {

    // メニュー画面
    if(gameState === 'menu'){
      return (
        // 既存のメニューのtsx
        <div>
          {/* ゲーム設定 */}
          <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center space-y-6">
            <h2 className="font-bold text-2xl">ゲーム設定</h2>
            {/* リストボックス */}
            <div className="w-full">
              <label className="block text-sm font-medium mb-2 text-center">カテゴリ</label>
              <select
                className="w-full p-4 border rounded-xl"
                value={category}
                onChange={handleCategoryChange}
              >
                <option value="general">一般知識</option>
                <option value="tech">テクノロジー</option>
              </select>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium mb-2 text-center">難易度</label>
              <select
                className="w-full p-4 border rounded-xl"
                value={difficulty}
                onChange={handleDifficultyChange}
              >
                <option value="easy">簡単（15秒）</option>
                <option value="normal">普通（10秒）</option>
                <option value="hard">難しい（7秒）</option>
              </select>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium mb-2 text-center">問題数</label>
              <select
                className="w-full p-4 border rounded-xl"
                value={questionCount}
                onChange={handleQuestionCountChange}
              >
                <option value={5}>5問</option>
                <option value={10}>10問</option>
                <option value={15}>15問</option>
              </select>
            </div>

            <div 
              className="w-full rounded-xl bg-purple-700 p-4 text-center text-white hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={startGame}
            >
            {/* <PlayIcon className="w-4 h-4" /> */}
              ゲーム開始
            </div>
          </div>

          {/* 統計情報 */}
          <div className="max-w-2xl mx-auto m-8 grid grid-cols-3 gap-6">
            <div className="bg-white flex flex-col items-center justify-center p-4 rounded-xl shadow-lg">
              <Target className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="text-2xl text-blue-500">95%</h3>
              <p>最高記録</p>
            </div>
            <div className="bg-white flex flex-col items-center justify-center p-4 rounded-xl shadow-lg">
              <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
              <h3 className="text-2xl text-yellow-500">12</h3>
              <p>ゲーム数</p>
            </div>
            <div className="bg-white flex flex-col items-center justify-center p-4 rounded-xl shadow-lg">
              <Star className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="text-2xl text-green-500">A</h3>
              <p>平均成績</p>
            </div>
          </div>

        </div>
      );
    }

    // ゲームプレイ画面
    if (gameState === 'playing') {
      const questions = getCurrentQuestions();
      const currentQuestion = questions[currentQuestionIndex];
      // 現在のプログレスバーの幅（%）
      const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
      
      // 問題がない場合の処理
      if (!currentQuestion) {
        return <div>問題を読み込み中...</div>;
      }
      
      return (
        <div className="max-w-2xl mx-auto p-8">
          {/* ヘッダー */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">

            {/* 問題番号とタイマー */}
            <div className="flex items-center justify-between mb-6">

              {/* 問題番号とトロフィーアイコン */}
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">
                  問題 {currentQuestionIndex + 1} / {questions.length}
                </h2>
                <Trophy className="w-6 h-6 text-purple-500 inline-block ml-2" />
              </div>

              {/* タイマー */}
              <div className="flex items-center space-x-2">
                <Clock className="w-6 h-6 text-blue-500" />
                <p className={`font-bold ${timeLeft <= 3 ? 'text-red-500' : 'text-blue-500'}`}>
                  {timeLeft}秒
                </p>
              </div>

            </div>

            {/* 解答進捗バー */}
            <div className="w-full bg-gray-300 rounded-full h-2">
              {/* w-full       : 親要素いっぱいに横幅を広げます。*/}
              {/* bg-gray-300  : 背景をグレー色に設定します。*/}
              {/* rounded-full : 四つ角を丸角とします。*/}
              {/* h-2          : 高さを設定します。*/}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="w-full bg-purple-600 rounded-full h-2 transition-all duration-300"
              />
                {/* motion.divはアニメーションを適用するためのコンポーネントです。*/}
                  {/* initial     : 初期状態のスタイルを設定します。*/}
                  {/* animate     : アニメーション後のスタイルを設定します。*/}
                  {/* width: `${progress}%` : プログレスバーの幅を現在の問題数に応じて設定します。*/}
                  {/* className   : スタイルを適用します。*/}
                    {/* w-full         : 親要素いっぱいに横幅を広げます。*/}
                    {/* bg-purple-600  : 背景を紫色に設定します。 */}
                    {/* rounded-full   : 四つ角を丸角とします。*/}
                    {/* h-2            : 高さを設定します。*/}
                    {/* transition-all : トラジション（変化）が可能なすべてのプロパティをトラジションします。ここではスタイルで定義しているwidthが含まれます。*/}
                    {/* duration-300   : トラジションにかける時間を定義します。*/}
            </div>

          </div>

          {/* 問題・選択肢・解説 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">

            {/* 問題文 */}
            <h3 className="text-xl mb-6">{currentQuestion.question}</h3>

            {/* 選択肢と解説欄 */}
            <div className="space-y-3">

              {/* 選択肢ボタン */}
              {currentQuestion.answers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    answered
                      ? index === currentQuestion.correctAnswer
                        ? `border-green-500 bg-green-50 text-green-800`
                        : index === selectedAnswer && index !== currentQuestion.correctAnswer
                          ? `border-red-500 bg-red-50 text-red-800`
                          : `border-gray-300 bg-gray-50 text-gray-800`
                      : `border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer`
                  }`}
                  disabled={selectedAnswer !== null}
                >
                  {answer}
                </button>
              ))}

              {/* 解説欄（未回答時点では表示されていない） */}
              {answered && (
                <div className="mt-4 p-4 bg-blue-100 rounded-lg border-blue-500 border">
                  <h4 className="font-semibold text-blue-800">解説:</h4>
                  <p className="text-blue-700">{currentQuestion.explanation}</p>
                </div>
              )}

            </div>
          </div>

          {/* フッター */}
          <button 
            onClick={goToHome}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            メニューに戻る
          </button>
        </div>
      );
    }

    // リザルト画面
    if (gameState === 'result') {
      // 回答した問題数を取得
      const questions = getCurrentQuestions();
      // ユーザーの正答率を取得
      const percentage = Math.round((score / questions.length) * 100);

      return (
        <div className="max-w-2xl mx-auto p-8 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">

            {/* リザルトヘッダー */}
            <div className="py-4">
              <h2 className="text-3xl font-semibold">ゲーム終了！</h2>
            </div>

            {/* スコアと正解率 */}
            <div className="mb-6">
              <div className="text-6xl font-bold text-purple-600">
                {score} / {questions.length}
              </div>
              <div className="text-xl text-gray-600">
                正解率: {percentage}%
              </div>
            </div>
            
            {/* 成績メッセージ */}
            <div className="text-lg py-2">
              {percentage >= 80 ? (
                <p className="text-green-600">素晴らしい成績です！🎉</p>
              ) : percentage >= 60 ? (
                <p className="text-blue-600 text-lg">良い成績です！👏</p>
              ) : (
                <p className="text-orange-600 text-lg">次回はもっと頑張りましょう！💪</p>
              )}
            </div>

            {/* 詳細結果 */}
            <div className="text-left mb-6">
              <h3 className="text-lg font-semibold mb-3">詳細結果</h3>
              {/* 回答した問題と正誤をリストで表示 */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {userAnswers.map((answer, index) => {
                  const questionData = getCurrentQuestions()[index];
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <p className="font-semibold">問題 {index + 1}: {answer.question}</p>
                      <p>{answer.isCorrect ? `✅ 正解` : `❌ 不正解`}</p>
                      {/* 不正解の場合に解答を表示する */}
                      {!answer.isCorrect && questionData && (
                        <p className="text-sm text-gray-600">
                          正解: {questionData.answers[answer.correctAnswer]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* リスタートとメニューに戻るボタン */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={startGame}
                className="text-white bg-purple-600 rounded-lg px-6 py-3"
              >
                もう一度プレイ
              </button>
              <button 
                onClick={goToHome}
                className="text-white bg-gray-600 rounded-lg px-6 py-3"
              >
                メニューに戻る
              </button>
            </div>

          </div>
        </div>
      );
    }
  }

  // 読み込み中
  if(!mounted){
    return (
      <div className="bg-gradient-to-br from-purple-200 to-purple-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-purple-700 mx-auto mb-4 animate-pulse" />
          <p className="text-purple-700 text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  // メインコンテンツ
  return (
    <div className="bg-gradient-to-br from-purple-200 to-purple-100 min-h-screen">
      <header>
        <div className="flex items-center justify-center flex-col text-center space-y-4 p-8">
          <Brain className="h-24 w-24 text-purple-700" />
          <h1 className="text-4xl">クイズチャレンジ</h1>
          <p>知識を試して楽しく学ぼう！</p>
          <p>現在の状態: {gameState}</p>
          <p className="text-sm text-gray-600">
            設定: {category} / {difficulty} / {questionCount}問 / {currentQuestionIndex}
          </p>
          {/* 問題データ確認用 */}
          <p className="text-xs text-gray-500">
            利用可能な問題数: {getCurrentQuestions().length}問
          </p>
        </div>
      </header>

      <main>
        {renderContent()}
      </main>

      <footer>
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex gap-2">
            <BrainCogIcon className="w-4 h-4 text-purple-600" />
            <p className="text-purple-600 font-bold">学習ポイント</p>
          </div>
          <p className="text-purple-600">ゲームロジック、タイマー機能、useRef、スコア管理</p>
          <p className="text-purple-600">画面遷移、条件分岐、配列操作、インタラクティブUI</p>
        </div>
      </footer>
    </div>
  );

}
