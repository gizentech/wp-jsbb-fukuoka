import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PieChartWithOther from '@/components/PieChartWithOther/PieChartWithOther';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import styles from './nosuke.module.css';

export default function NosukeDashboard() {
  const router = useRouter();
  const [surveys, setSurveys] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', kana: '' });
  const [activeTab, setActiveTab] = useState('statistics'); // 'statistics', 'schools', 'responses'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  // 認証処理
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'fukuoka2025') {
      setIsAuthenticated(true);
    } else {
      alert('パスワードが正しくありません。');
      setPassword('');
    }
  };

  // 初期ロード
  useEffect(() => {
    if (isAuthenticated) {
      fetchSurveys();
      fetchSchools();
    }
  }, [isAuthenticated]);

  // アンケート結果を取得
  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fukuoka-hbf/get-surveys');
      const data = await response.json();
      if (data.success) {
        setSurveys(data.surveys);
        calculateStats(data.surveys);
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      alert('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 高校リストを取得
  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/fukuoka-hbf/schools');
      const data = await response.json();
      if (data.success) {
        setSchools(data.schools);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  // 統計を計算
  const calculateStats = (surveyData) => {
    // 高校別集計
    const schoolStats = {};
    surveyData.forEach(survey => {
      if (!survey.disagreement && survey.schoolName) {
        if (!schoolStats[survey.schoolName]) {
          schoolStats[survey.schoolName] = {
            total: 0,
            interested: 0, // やってみたい + 興味がある
            notInterested: 0, // 今の段階ではない + 選手の道を続ける
          };
        }

        schoolStats[survey.schoolName].total++;

        // Q6の回答に基づいて分類
        if (survey.q6_future === 'やってみたい' || survey.q6_future === '興味がある') {
          schoolStats[survey.schoolName].interested++;
        } else if (survey.q6_future === '今の段階ではない' || survey.q6_future === '選手の道を続ける') {
          schoolStats[survey.schoolName].notInterested++;
        }
      }
    });

    const statistics = {
      total: surveyData.length,
      agreed: surveyData.filter(s => !s.disagreement).length,
      disagreed: surveyData.filter(s => s.disagreement).length,
      schoolStats: schoolStats,
      q1_reasons: {},
      q1_otherResponses: [],
      q2_satisfaction: {},
      q3_satisfactionResponses: [],
      q4_interests: {},
      q4_otherResponses: [],
      q5_learningResponses: [],
      q6_future: {},
      q6_otherResponses: [],
      q7_concernsResponses: [],
      q8_feedbackResponses: [],
      q9_seminarFeedbackResponses: [],
      q10_nextSeminar: {},
      q11_availableDates: {},
    };

    surveyData.forEach(survey => {
      if (!survey.disagreement) {
        // Q1: 参加理由
        if (Array.isArray(survey.q1_reasons)) {
          survey.q1_reasons.forEach(reason => {
            statistics.q1_reasons[reason] = (statistics.q1_reasons[reason] || 0) + 1;
          });
        }

        // Q1 その他（テキスト回答）
        if (survey.q1_other && survey.q1_other.trim()) {
          statistics.q1_otherResponses.push(survey.q1_other);
        }

        // Q2: 満足度
        if (survey.q2_satisfaction) {
          statistics.q2_satisfaction[survey.q2_satisfaction] =
            (statistics.q2_satisfaction[survey.q2_satisfaction] || 0) + 1;
        }

        // Q3: 満足度の理由（テキスト回答）
        if (survey.q3_satisfactionReason && survey.q3_satisfactionReason.trim()) {
          statistics.q3_satisfactionResponses.push(survey.q3_satisfactionReason);
        }

        // Q4: 興味のあった内容
        if (Array.isArray(survey.q4_interests)) {
          survey.q4_interests.forEach(interest => {
            statistics.q4_interests[interest] = (statistics.q4_interests[interest] || 0) + 1;
          });
        }

        // Q4 その他（テキスト回答）
        if (survey.q4_other && survey.q4_other.trim()) {
          statistics.q4_otherResponses.push(survey.q4_other);
        }

        // Q5: 学び（テキスト回答）
        if (survey.q5_learning && survey.q5_learning.trim()) {
          statistics.q5_learningResponses.push(survey.q5_learning);
        }

        // Q6: 今後の可能性
        if (survey.q6_future) {
          statistics.q6_future[survey.q6_future] =
            (statistics.q6_future[survey.q6_future] || 0) + 1;
        }

        // Q6 その他（テキスト回答）
        if (survey.q6_other && survey.q6_other.trim()) {
          statistics.q6_otherResponses.push(survey.q6_other);
        }

        // Q7: 懸念点（テキスト回答）
        if (survey.q7_concerns && survey.q7_concerns.trim()) {
          statistics.q7_concernsResponses.push(survey.q7_concerns);
        }

        // Q8: 感想（テキスト回答）
        if (survey.q8_feedback && survey.q8_feedback.trim()) {
          statistics.q8_feedbackResponses.push(survey.q8_feedback);
        }

        // Q9: 講習会の感想・質問（テキスト回答）
        if (survey.q9_seminarFeedback && survey.q9_seminarFeedback.trim()) {
          statistics.q9_seminarFeedbackResponses.push(survey.q9_seminarFeedback);
        }

        // Q10: 次回講習会
        if (survey.q10_nextSeminar) {
          statistics.q10_nextSeminar[survey.q10_nextSeminar] =
            (statistics.q10_nextSeminar[survey.q10_nextSeminar] || 0) + 1;
        }

        // Q11: 参加可能日
        if (Array.isArray(survey.q11_availableDates)) {
          survey.q11_availableDates.forEach(date => {
            statistics.q11_availableDates[date] = (statistics.q11_availableDates[date] || 0) + 1;
          });
        }
      }
    });

    setStats(statistics);
  };

  // 円グラフを描画する関数
  const drawPieChart = (page, data, centerX, centerY, radius, font) => {
    if (!data || Object.keys(data).length === 0) return;

    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    if (total === 0) return;

    const labels = Object.keys(data);
    const values = Object.values(data);

    // カラーパレット（画面表示と同じ）
    const colors = [
      { r: 0.102, g: 0.137, b: 0.494 }, // #1a237e 紺色
      { r: 0.224, g: 0.286, b: 0.671 }, // #3949ab 薄い紺
      { r: 0.129, g: 0.588, b: 0.953 }, // #2196F3 青
      { r: 0.000, g: 0.675, b: 0.757 }, // #00ACC1 濃い水色
      { r: 0.302, g: 0.816, b: 0.882 }, // #4DD0E1 薄い水色
      { r: 0.620, g: 0.620, b: 0.620 }, // #9E9E9E グレー
      { r: 0.741, g: 0.741, b: 0.741 }, // #BDBDBD 薄いグレー
      { r: 0.878, g: 0.878, b: 0.878 }, // #E0E0E0 薄いグレー2
    ];

    let currentAngle = -90; // 12時の位置から開始

    // 円グラフを描画
    values.forEach((value, index) => {
      const percentage = (value / total) * 100;
      const sweepAngle = (value / total) * 360;
      const color = colors[index % colors.length];

      // 扇形を描画（複数の線分で円弧を近似）
      const steps = Math.max(Math.ceil(sweepAngle / 2), 1);
      const angleStep = sweepAngle / steps;

      for (let i = 0; i <= steps; i++) {
        const angle1 = (currentAngle + (i * angleStep)) * (Math.PI / 180);
        const angle2 = (currentAngle + ((i + 1) * angleStep)) * (Math.PI / 180);

        const x1 = centerX + radius * Math.cos(angle1);
        const y1 = centerY + radius * Math.sin(angle1);
        const x2 = centerX + radius * Math.cos(angle2);
        const y2 = centerY + radius * Math.sin(angle2);

        // 三角形を描画（中心、点1、点2）
        page.drawLine({
          start: { x: centerX, y: centerY },
          end: { x: x1, y: y1 },
          thickness: 1,
          color: rgb(color.r, color.g, color.b),
        });

        if (i < steps) {
          // 扇形の塗りつぶしを線で近似
          for (let r = 0; r < radius; r += 2) {
            const ratio = r / radius;
            const innerX1 = centerX + r * Math.cos(angle1);
            const innerY1 = centerY + r * Math.sin(angle1);
            const innerX2 = centerX + r * Math.cos(angle2);
            const innerY2 = centerY + r * Math.sin(angle2);

            page.drawLine({
              start: { x: innerX1, y: innerY1 },
              end: { x: innerX2, y: innerY2 },
              thickness: 2,
              color: rgb(color.r, color.g, color.b),
            });
          }
        }
      }

      currentAngle += sweepAngle;
    });

    // 外枠の円を描画
    const circleSteps = 100;
    for (let i = 0; i < circleSteps; i++) {
      const angle1 = (i / circleSteps) * 2 * Math.PI;
      const angle2 = ((i + 1) / circleSteps) * 2 * Math.PI;
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);

      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: 2,
        color: rgb(1, 1, 1), // 白色の境界線
      });
    }

    // 凡例を描画（グラフの下）
    let legendY = centerY - radius - 30;
    const legendX = centerX - radius;

    labels.forEach((label, index) => {
      const value = values[index];
      const percentage = ((value / total) * 100).toFixed(1);
      const color = colors[index % colors.length];

      // 色の四角
      page.drawRectangle({
        x: legendX,
        y: legendY - 8,
        width: 12,
        height: 12,
        color: rgb(color.r, color.g, color.b),
      });

      // ラベルとパーセンテージ
      page.drawText(`${label}: ${percentage}% (${value}件)`, {
        x: legendX + 18,
        y: legendY - 6,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      legendY -= 15;
    });
  };

  // PDF出力（pdf-libを使用、2問ずつ1ページ）
  const downloadPDF = async () => {
    if (!stats || !stats.total) {
      alert('ダウンロードするデータがありません');
      return;
    }

    try {
      // PDF生成中メッセージ
      const originalTab = activeTab;
      setActiveTab('statistics');
      await new Promise(resolve => setTimeout(resolve, 500)); // レンダリング待機

      // PDFドキュメントを作成
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      // 日本語フォントを読み込み（Noto Sans JP）
      const fontUrl = 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf';
      const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
      const font = await pdfDoc.embedFont(fontBytes);

      // 統計データを配列にまとめる
      const questions = [
        { title: 'Q1. 参加理由（複数回答）', data: stats.q1_reasons, otherResponses: stats.q1_otherResponses },
        { title: 'Q2. 満足度', data: stats.q2_satisfaction, otherResponses: stats.q3_satisfactionResponses },
        { title: 'Q4. 興味のあった内容（複数回答）', data: stats.q4_interests, otherResponses: stats.q4_otherResponses },
        { title: 'Q5. 学び（テキスト回答）', data: {}, otherResponses: stats.q5_learningResponses },
        { title: 'Q6. 審判を選ぶ可能性', data: stats.q6_future, otherResponses: stats.q6_otherResponses },
        { title: 'Q7. 懸念点（テキスト回答）', data: {}, otherResponses: stats.q7_concernsResponses },
        { title: 'Q8. 感想（テキスト回答）', data: {}, otherResponses: stats.q8_feedbackResponses },
        { title: 'Q9. 講習会の感想・質問（テキスト回答）', data: {}, otherResponses: stats.q9_seminarFeedbackResponses },
        { title: 'Q10. 次回講習会への参加意向', data: stats.q10_nextSeminar, otherResponses: [] },
        { title: 'Q11. 参加可能日（複数回答）', data: stats.q11_availableDates, otherResponses: [] },
      ];

      const pageWidth = 595.28; // A4 width in points
      const pageHeight = 841.89; // A4 height in points
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
      const leftColumnWidth = 250; // グラフ列の幅
      const rightColumnX = margin + leftColumnWidth + 20; // テキスト列の開始位置
      const rightColumnWidth = contentWidth - leftColumnWidth - 20;

      let currentPage = null;
      let questionsOnPage = 0;
      let yPosition = 0;

      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions[qIndex];

        // データがない質問はスキップ
        if ((!question.data || Object.keys(question.data).length === 0) &&
            (!question.otherResponses || question.otherResponses.length === 0)) {
          continue;
        }

        // 2問ごとに新しいページ
        if (questionsOnPage === 0 || questionsOnPage === 2) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
          questionsOnPage = 0;
        }

        // タイトル
        currentPage.drawText(question.title, {
          x: margin,
          y: yPosition,
          size: 14,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 25;

        const startY = yPosition;

        // グラフをネイティブ描画
        if (question.data && Object.keys(question.data).length > 0) {
          const chartCenterX = margin + 100;
          const chartCenterY = yPosition - 100;
          const chartRadius = 80;

          drawPieChart(currentPage, question.data, chartCenterX, chartCenterY, chartRadius, font);
        }

        // その他の回答（右側にテキストで描画）
        if (question.otherResponses && question.otherResponses.length > 0) {
          let textY = startY;

          currentPage.drawText('その他の回答:', {
            x: rightColumnX,
            y: textY,
            size: 11,
            font: font,
            color: rgb(0, 0, 0),
          });
          textY -= 18;

          const maxResponses = Math.min(question.otherResponses.length, 20);
          for (let i = 0; i < maxResponses; i++) {
            const response = question.otherResponses[i];
            const maxChars = 30;
            const displayText = response.length > maxChars ? response.substring(0, maxChars) + '...' : response;

            if (textY < margin + 50) break; // ページ下部に到達したら停止

            currentPage.drawText(`• ${displayText}`, {
              x: rightColumnX,
              y: textY,
              size: 8,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
            textY -= 12;
          }

          if (question.otherResponses.length > maxResponses) {
            currentPage.drawText(`...他 ${question.otherResponses.length - maxResponses}件`, {
              x: rightColumnX,
              y: textY,
              size: 8,
              font: font,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }

        yPosition -= 250; // 次の質問のためのスペース
        questionsOnPage++;
      }

      // 高校別集計ページを追加
      if (stats.schoolStats && Object.keys(stats.schoolStats).length > 0) {
        const schoolPage = pdfDoc.addPage([pageWidth, pageHeight]);
        let schoolY = pageHeight - margin;

        // タイトル
        schoolPage.drawText('高校別集計', {
          x: margin,
          y: schoolY,
          size: 16,
          font: font,
          color: rgb(0, 0, 0),
        });
        schoolY -= 30;

        // テーブルヘッダー
        const colWidths = [300, 80, 80]; // 高校名、総数、興味あり
        const tableX = margin;
        const rowHeight = 20;

        // ヘッダー背景
        schoolPage.drawRectangle({
          x: tableX,
          y: schoolY - rowHeight,
          width: colWidths[0] + colWidths[1] + colWidths[2],
          height: rowHeight,
          color: rgb(0.9, 0.9, 0.9),
        });

        // ヘッダーテキスト
        schoolPage.drawText('高校名', {
          x: tableX + 5,
          y: schoolY - 14,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        });

        schoolPage.drawText('総数', {
          x: tableX + colWidths[0] + 5,
          y: schoolY - 14,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        });

        schoolPage.drawText('興味あり', {
          x: tableX + colWidths[0] + colWidths[1] + 5,
          y: schoolY - 14,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        });

        schoolY -= rowHeight;

        // テーブルデータ
        const schoolEntries = Object.entries(stats.schoolStats).sort(([a], [b]) =>
          a.localeCompare(b, 'ja')
        );

        let rowIndex = 0;
        for (const [schoolName, data] of schoolEntries) {
          // ページの終わりに近づいたら新しいページ
          if (schoolY < margin + 50) {
            const newSchoolPage = pdfDoc.addPage([pageWidth, pageHeight]);
            schoolY = pageHeight - margin;

            // 新しいページにもヘッダーを追加
            newSchoolPage.drawRectangle({
              x: tableX,
              y: schoolY - rowHeight,
              width: colWidths[0] + colWidths[1] + colWidths[2],
              height: rowHeight,
              color: rgb(0.9, 0.9, 0.9),
            });

            newSchoolPage.drawText('高校名', {
              x: tableX + 5,
              y: schoolY - 14,
              size: 11,
              font: font,
              color: rgb(0, 0, 0),
            });

            newSchoolPage.drawText('総数', {
              x: tableX + colWidths[0] + 5,
              y: schoolY - 14,
              size: 11,
              font: font,
              color: rgb(0, 0, 0),
            });

            newSchoolPage.drawText('興味あり', {
              x: tableX + colWidths[0] + colWidths[1] + 5,
              y: schoolY - 14,
              size: 11,
              font: font,
              color: rgb(0, 0, 0),
            });

            schoolY -= rowHeight;
            currentPage = newSchoolPage;
            rowIndex = 0;
          } else {
            currentPage = schoolPage;
          }

          // 行の背景（ストライプ）
          if (rowIndex % 2 === 0) {
            currentPage.drawRectangle({
              x: tableX,
              y: schoolY - rowHeight,
              width: colWidths[0] + colWidths[1] + colWidths[2],
              height: rowHeight,
              color: rgb(0.97, 0.97, 0.97),
            });
          }

          // 高校名
          currentPage.drawText(schoolName, {
            x: tableX + 5,
            y: schoolY - 14,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
          });

          // 総数
          currentPage.drawText(`${data.total}件`, {
            x: tableX + colWidths[0] + 5,
            y: schoolY - 14,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
          });

          // 興味あり
          currentPage.drawText(`${data.interested}件`, {
            x: tableX + colWidths[0] + colWidths[1] + 5,
            y: schoolY - 14,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
          });

          // 罫線
          currentPage.drawLine({
            start: { x: tableX, y: schoolY - rowHeight },
            end: { x: tableX + colWidths[0] + colWidths[1] + colWidths[2], y: schoolY - rowHeight },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
          });

          schoolY -= rowHeight;
          rowIndex++;
        }

        // テーブルの外枠
        const tableHeight = (schoolEntries.length + 1) * rowHeight;
        const finalTableY = schoolY + rowHeight;

        // 左の線
        currentPage.drawLine({
          start: { x: tableX, y: pageHeight - margin - 30 },
          end: { x: tableX, y: finalTableY },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5),
        });

        // 右の線
        currentPage.drawLine({
          start: { x: tableX + colWidths[0] + colWidths[1] + colWidths[2], y: pageHeight - margin - 30 },
          end: { x: tableX + colWidths[0] + colWidths[1] + colWidths[2], y: finalTableY },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5),
        });

        // 列の縦線
        currentPage.drawLine({
          start: { x: tableX + colWidths[0], y: pageHeight - margin - 30 },
          end: { x: tableX + colWidths[0], y: finalTableY },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });

        currentPage.drawLine({
          start: { x: tableX + colWidths[0] + colWidths[1], y: pageHeight - margin - 30 },
          end: { x: tableX + colWidths[0] + colWidths[1], y: finalTableY },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });
      }

      // PDFを保存
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `fukuoka-hbf-statistics_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();

      // 元のタブに戻す
      setActiveTab(originalTab);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成中にエラーが発生しました。');
    }
  };

  // CSV出力
  const downloadCSV = () => {
    if (surveys.length === 0) {
      alert('ダウンロードするデータがありません');
      return;
    }

    const headers = [
      '提出日時',
      '電話番号',
      '学校名',
      '同意',
      '同意しない',
      'Q1_参加理由',
      'Q1_その他',
      'Q2_満足度',
      'Q3_満足度の理由',
      'Q4_興味のあった内容',
      'Q4_その他',
      'Q5_学び',
      'Q6_今後の可能性',
      'Q6_その他',
      'Q7_懸念点',
      'Q8_感想',
      'Q9_講習会の感想・質問',
      'Q10_次回講習会',
      'Q11_参加可能日',
    ];

    const rows = surveys.map(survey => [
      survey.submittedAt || '',
      survey.phone || '',
      survey.schoolName || '',
      survey.consent || '',
      survey.disagreement ? 'はい' : 'いいえ',
      Array.isArray(survey.q1_reasons) ? survey.q1_reasons.join('; ') : '',
      survey.q1_other || '',
      survey.q2_satisfaction || '',
      survey.q3_satisfactionReason || '',
      Array.isArray(survey.q4_interests) ? survey.q4_interests.join('; ') : '',
      survey.q4_other || '',
      survey.q5_learning || '',
      survey.q6_future || '',
      survey.q6_other || '',
      survey.q7_concerns || '',
      survey.q8_feedback || '',
      survey.q9_seminarFeedback || '',
      survey.q10_nextSeminar || '',
      Array.isArray(survey.q11_availableDates) ? survey.q11_availableDates.join('; ') : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fukuoka-hbf-surveys_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 高校追加
  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!newSchool.name || !newSchool.kana) {
      alert('高校名と高校名かなの両方を入力してください');
      return;
    }

    try {
      const response = await fetch('/api/fukuoka-hbf/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSchool),
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        alert('高校を追加しました');
        setNewSchool({ name: '', kana: '' });
        setShowAddSchool(false);
        fetchSchools();
      } else {
        console.error('API Error:', data);
        alert('エラー: ' + data.error + '\n詳細: ' + (data.details || ''));
      }
    } catch (error) {
      console.error('Error adding school:', error);
      alert('高校の追加に失敗しました: ' + error.message);
    }
  };

  // 高校削除
  const handleDeleteSchool = async (schoolId, schoolName) => {
    if (!confirm(`「${schoolName}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      const response = await fetch('/api/fukuoka-hbf/schools', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schoolId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('高校を削除しました');
        fetchSchools();
      } else {
        console.error('API Error:', data);
        alert('エラー: ' + data.error + '\n詳細: ' + (data.details || ''));
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('高校の削除に失敗しました: ' + error.message);
    }
  };

  // 初期高校データを追加
  const handleInitSchools = async () => {
    if (!confirm('初期高校データ（62件）を追加しますか？\n※既にデータがある場合はエラーになります。')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/fukuoka-hbf/init-schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchSchools();
      } else {
        console.error('API Error:', data);
        alert('エラー: ' + data.error);
      }
    } catch (error) {
      console.error('Error initializing schools:', error);
      alert('初期化に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // CSVインポート
  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        // ヘッダーをスキップ
        const dataLines = lines.slice(1);

        const schools = dataLines.map(line => {
          const [name, kana] = line.split(',').map(cell => cell.trim().replace(/"/g, ''));
          return { name, kana };
        }).filter(school => school.name && school.kana);

        if (schools.length === 0) {
          alert('有効なデータが見つかりませんでした。');
          return;
        }

        if (!confirm(`${schools.length}件の高校をインポートしますか？`)) {
          return;
        }

        setLoading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const school of schools) {
          try {
            const response = await fetch('/api/fukuoka-hbf/schools', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(school),
            });

            const data = await response.json();
            if (data.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }

        alert(`インポート完了\n成功: ${successCount}件\nエラー: ${errorCount}件`);
        fetchSchools();
        setCsvFile(null);
        e.target.value = '';
      } catch (error) {
        console.error('CSV読み込みエラー:', error);
        alert('CSVファイルの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  // ログイン画面
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>福岡県高校生対象審判講習会 管理画面 - ログイン</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className={styles.loginContainer}>
          <div className={styles.loginBox}>
            <h1>管理画面ログイン</h1>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                className={styles.passwordInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                autoFocus
              />
              <button type="submit" className={styles.loginButton}>
                ログイン
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>福岡県高校生対象審判講習会 管理画面</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="福岡県高校生対象審判講習会のアンケート管理画面です。" />

        {/* OGP */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="福岡県高校生対象審判講習会 管理画面" />
        <meta property="og:description" content="福岡県高校生対象審判講習会のアンケート管理画面です。" />
        <meta property="og:site_name" content="福岡県高校生対象審判講習会" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="福岡県高校生対象審判講習会 管理画面" />
        <meta name="twitter:description" content="福岡県高校生対象審判講習会のアンケート管理画面です。" />
      </Head>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>福岡県高校生対象審判講習会 管理画面</h1>
        </div>

        {/* タブナビゲーション */}
        <div className={styles.tabNav}>
          <div className={styles.tabButtons}>
            <button
              className={`${styles.tabButton} ${activeTab === 'statistics' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              統計情報
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'schools' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('schools')}
            >
              登録高校一覧
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'responses' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('responses')}
            >
              回答リスト
            </button>
          </div>
          <div className={styles.tabActions}>
            <button onClick={downloadPDF} className={styles.tabActionButton}>
              PDF出力
            </button>
            <button onClick={downloadCSV} className={styles.tabActionButton}>
              CSVダウンロード
            </button>
            <button onClick={fetchSurveys} className={styles.tabActionButton}>
              データを更新
            </button>
          </div>
        </div>

      <div className={styles.content}>
        {/* 統計情報タブ */}
        {activeTab === 'statistics' && (
          <>
        <section className={styles.section} id="statistics-content">
          <h2>統計情報</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>総回答数</div>
              <div className={styles.statValue}>{stats.total || 0}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>同意した回答</div>
              <div className={styles.statValue}>{stats.agreed || 0}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>同意しなかった回答</div>
              <div className={styles.statValue}>{stats.disagreed || 0}</div>
            </div>
          </div>

          {/* Q1: 参加理由 */}
          <PieChartWithOther
            title="Q1. 参加理由（複数回答）"
            data={stats.q1_reasons}
            otherResponses={stats.q1_otherResponses}
          />

          {/* Q2: 満足度 */}
          <PieChartWithOther
            title="Q2. 満足度"
            data={stats.q2_satisfaction}
            otherResponses={stats.q3_satisfactionResponses}
          />

          {/* Q4: 興味のあった内容 */}
          <PieChartWithOther
            title="Q4. 興味のあった内容（複数回答）"
            data={stats.q4_interests}
            otherResponses={stats.q4_otherResponses}
          />

          {/* Q5: 学び */}
          {stats.q5_learningResponses && stats.q5_learningResponses.length > 0 && (
            <PieChartWithOther
              title="Q5. 学び（テキスト回答）"
              data={{}}
              otherResponses={stats.q5_learningResponses}
            />
          )}

          {/* Q6: 今後の可能性 */}
          <PieChartWithOther
            title="Q6. 審判を選ぶ可能性"
            data={stats.q6_future}
            otherResponses={stats.q6_otherResponses}
          />

          {/* Q7: 懸念点 */}
          {stats.q7_concernsResponses && stats.q7_concernsResponses.length > 0 && (
            <PieChartWithOther
              title="Q7. 懸念点（テキスト回答）"
              data={{}}
              otherResponses={stats.q7_concernsResponses}
            />
          )}

          {/* Q8: 感想 */}
          {stats.q8_feedbackResponses && stats.q8_feedbackResponses.length > 0 && (
            <PieChartWithOther
              title="Q8. 感想（テキスト回答）"
              data={{}}
              otherResponses={stats.q8_feedbackResponses}
            />
          )}

          {/* Q9: 講習会の感想・質問 */}
          {stats.q9_seminarFeedbackResponses && stats.q9_seminarFeedbackResponses.length > 0 && (
            <PieChartWithOther
              title="Q9. 講習会の感想・質問（テキスト回答）"
              data={{}}
              otherResponses={stats.q9_seminarFeedbackResponses}
            />
          )}

          {/* Q10: 次回講習会 */}
          <PieChartWithOther
            title="Q10. 次回講習会への参加意向"
            data={stats.q10_nextSeminar}
          />

          {/* Q11: 参加可能日 */}
          <PieChartWithOther
            title="Q11. 参加可能日（複数回答）"
            data={stats.q11_availableDates}
          />

          {/* 高校別集計 */}
          <div className={styles.schoolStatsContainer}>
            <h3 className={styles.schoolStatsTitle}>高校別集計</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>高校名</th>
                    <th>総数</th>
                    <th>興味あり</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.schoolStats || {})
                    .sort(([a], [b]) => a.localeCompare(b, 'ja'))
                    .map(([schoolName, data]) => (
                      <tr key={schoolName}>
                        <td>{schoolName}</td>
                        <td>{data.total}件</td>
                        <td>{data.interested}件</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
          </>
        )}

        {/* 登録高校一覧タブ */}
        {activeTab === 'schools' && (
          <>
        <section className={styles.section}>
          <h2>登録高校一覧 ({schools.length}件)</h2>

          {/* 高校追加ボタン */}
          <div className={styles.actions}>
            <button onClick={() => setShowAddSchool(!showAddSchool)} className={styles.actionButton}>
              {showAddSchool ? '高校追加をキャンセル' : '高校を追加'}
            </button>
            <label className={styles.actionButton} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
              CSVインポート
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* 高校追加フォーム */}
          {showAddSchool && (
            <div className={styles.addSchoolForm}>
              <h3>高校を追加</h3>
              <form onSubmit={handleAddSchool}>
                <div className={styles.formGroup}>
                  <label>高校名</label>
                  <input
                    type="text"
                    value={newSchool.name}
                    onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                    placeholder="例: 福岡高等学校"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>高校名かな</label>
                  <input
                    type="text"
                    value={newSchool.kana}
                    onChange={(e) => setNewSchool({ ...newSchool, kana: e.target.value })}
                    placeholder="例: ふくおかこうとうがっこう"
                    className={styles.input}
                  />
                </div>
                <button type="submit" className={styles.submitButton}>
                  追加
                </button>
              </form>
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>読み込み中...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>高校名</th>
                    <th className={styles.kanaColumn}>高校名かな</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school, index) => (
                    <tr key={school.id}>
                      <td>{index + 1}</td>
                      <td>{school.name}</td>
                      <td className={styles.kanaColumn}>{school.kana}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteSchool(school.id, school.name)}
                          className={styles.deleteButton}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
          </>
        )}

        {/* 回答リストタブ */}
        {activeTab === 'responses' && (
          <>
        <section className={styles.section}>
          <h2>回答リスト ({surveys.length}件)</h2>
          {loading ? (
            <div className={styles.loading}>読み込み中...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>提出日時</th>
                    <th>学校名</th>
                    <th>電話番号</th>
                    <th>同意</th>
                    <th>Q2_満足度</th>
                    <th>Q6_可能性</th>
                    <th>Q10_次回</th>
                  </tr>
                </thead>
                <tbody>
                  {surveys.map((survey, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{survey.submittedAt ? new Date(survey.submittedAt).toLocaleString('ja-JP') : '-'}</td>
                      <td>{survey.schoolName || '-'}</td>
                      <td>{survey.phone || '-'}</td>
                      <td>{survey.disagreement ? '同意しない' : '同意する'}</td>
                      <td>{survey.q2_satisfaction || '-'}</td>
                      <td>{survey.q6_future || '-'}</td>
                      <td>{survey.q10_nextSeminar || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
          </>
        )}
      </div>
    </div>
    </>
  );
}
