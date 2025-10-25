'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'Начало работы',
      questions: [
        {
          q: 'Что такое eSIM и как это работает?',
          a: 'eSIM - это встроенная SIM-карта, которая встроена в ваше устройство. Вместо физической SIM-карты информация загружается в ваш телефон через QR-код. Это позволяет активировать мобильную связь без необходимости менять физическую карту.'
        },
        {
          q: 'Какие устройства поддерживают eSIM?',
          a: 'Большинство современных смартфонов и планшетов поддерживают eSIM. Популярные модели включают iPhone XR и новее, Samsung Galaxy S20 и новее, Google Pixel 3 и новее, а также многие другие.'
        },
        {
          q: 'Как активировать мой eSIM?',
          a: 'После покупки плана вы получите QR-код. Перейдите в настройки сотовой связи на вашем устройстве, выберите "Добавить тарифный план" и отсканируйте QR-код. Следуйте инструкциям на экране.'
        },
        {
          q: 'Нужно ли удалять физическую SIM-карту?',
          a: 'Нет, вам не нужно удалять физическую SIM-карту. eSIM работает параллельно с вашей обычной SIM-картой. Вы можете использовать обе одновременно или переключаться между ними в настройках.'
        }
      ]
    },
    {
      category: 'Тарифы и оплата',
      questions: [
        {
          q: 'Какие способы оплаты вы принимаете?',
          a: 'Мы принимаем все основные кредитные и дебетовые карты, PayPal и другие популярные методы оплаты. Все транзакции защищены банковским уровнем шифрования.'
        },
        {
          q: 'Могу ли я получить возврат средств, если я не доволен?',
          a: 'Да, мы предлагаем 30-дневную гарантию возврата средств. Если вы не удовлетворены нашим сервисом, свяжитесь с нашей службой поддержки в течение 30 дней с момента покупки.'
        },
        {
          q: 'Включают ли ваши тарифы безлимитный интернет?',
          a: 'Наши планы различаются по объему данных. Некоторые планы предлагают большие объемы данных, но все наши тарифы имеют справедливое использование данных для обеспечения качественного обслуживания всех пользователей.'
        },
        {
          q: 'Как долго действует мой план eSIM?',
          a: 'Срок действия плана зависит от выбранного вами тарифа. У нас есть планы от 7 до 30 дней. Вы получите уведомление за несколько дней до окончания действия плана.'
        }
      ]
    },
    {
      category: 'Проблемы с подключением',
      questions: [
        {
          q: 'Мой eSIM не подключается к сети. Что делать?',
          a: 'Убедитесь, что вы активировали eSIM в настройках устройства, включите "Роуминг данных" и перезагрузите устройство. Если проблема не решена, проверьте зону покрытия или свяжитесь с нами.'
        },
        {
          q: 'Почему скорость моих данных медленнее, чем ожидалось?',
          a: 'Скорость данных может варьироваться в зависимости от местоположения, загрузки сети и вашего устройства. В некоторых районах скорость может быть ниже, чем в других.'
        },
        {
          q: 'Могу ли я использовать eSIM для звонков и SMS?',
          a: 'Большинство наших планов предназначены для использования данных. Для звонков и SMS рекомендуется использовать приложения VoIP, такие как WhatsApp, Skype или FaceTime.'
        }
      ]
    },
    {
      category: 'Покрытие и доступность',
      questions: [
        {
          q: 'В каких странах работает GlobalBanka?',
          a: 'Мы предлагаем покрытие в более чем 200 странах по всему миру. Это включает в себя Европу, Азию, Северную и Южную Америку, Африку и Ближний Восток.'
        },
        {
          q: 'Могу ли я использовать свой eSIM в нескольких странах?',
          a: 'Да, многие наши планы предлагают мультистрановое покрытие, что позволяет использовать один eSIM в нескольких странах региона без необходимости покупать отдельные планы.'
        }
      ]
    }
  ];

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Часто задаваемые вопросы
        </h2>
        <p className="text-gray-400 text-lg">
          Найдите ответы на популярные вопросы о наших eSIM услугах
        </p>
      </div>

      {faqs.map((category, categoryIndex) => (
        <div key={categoryIndex} className="mb-8">
          <h3 className="text-xl font-semibold text-blue-400 mb-4">
            {category.category}
          </h3>
          
          <div className="space-y-3">
            {category.questions.map((item, questionIndex) => {
              const globalIndex = `${categoryIndex}-${questionIndex}`;
              const isOpen = openIndex === globalIndex;
              
              return (
                <div 
                  key={questionIndex}
                  className="bg-gray-800/90 backdrop-blur-md rounded-lg border border-gray-700/50 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleQuestion(globalIndex)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                  >
                    <span className="text-white font-medium pr-4">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="px-6 pb-4 border-t border-gray-700/30">
                      <p className="text-gray-300 pt-4 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-12 text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/30">
        <h3 className="text-xl font-semibold text-white mb-4">
          Остались вопросы?
        </h3>
        <p className="text-gray-400 mb-6">
          Не можете найти ответ? Наша служба поддержки готова помочь.
        </p>
        <a
          href="mailto:support@roamjet.net"
          onClick={(e) => e.stopPropagation()}
          className="inline-block px-6 py-3 bg-blue-400 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
        >
          Связаться с поддержкой
        </a>
      </div>
    </div>
  );
};

export default FAQ;

