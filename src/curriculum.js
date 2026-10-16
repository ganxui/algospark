// Course content: 12 lessons on Python for loops.

const MASCOTS = {
  "vector": "<svg width=\"58\" height=\"58\" viewBox=\"0 0 48 48\" fill=\"none\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"24\" r=\"18\" fill=\"#059669\"/><circle cx=\"24\" cy=\"24\" r=\"12\" fill=\"#10b981\"/><circle cx=\"24\" cy=\"24\" r=\"6\" fill=\"#ecfdf5\"/><path d=\"M6 24H12M36 24H42M24 6V12M24 36V42\" stroke=\"#34d399\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>"
};

const SECTIONS = [
  {
    "id": 1,
    "title": "Часть 1 · Повторения и range()",
    "range": "Уроки 1–4",
    "start": 1,
    "end": 4
  },
  {
    "id": 2,
    "title": "Часть 2 · Счётчики и алгоритмы",
    "range": "Уроки 5–8",
    "start": 5,
    "end": 8
  },
  {
    "id": 3,
    "title": "Часть 3 · Списки и маршрут",
    "range": "Уроки 9–12",
    "start": 9,
    "end": 12
  }
];

const UNITS = [
  {
    "id": 1,
    "sec": 1,
    "mascot": "vector",
    "t": "Циклы for",
    "sub": "Научи дрона повторять команды и считать шаги",
    "start": 1,
    "end": 12,
    "themeName": "Циклы for",
    "color": "#059669",
    "depth": "#047857",
    "grad": "linear-gradient(135deg, #34d399, #047857)"
  }
];

const ALL_LESSONS = [
  {
    "id": 1,
    "diff": 1,
    "title": "Повторяем команду",
    "desc": "Первый цикл for: одна команда выполняется несколько раз.",
    "theoryRule": "Цикл for повторяет команды для каждого значения. Команды внутри цикла пишутся с отступом.",
    "theoryCode": "for step in range(3):\n    print(\"Вперёд!\")",
    "theoryOutput": ">>> Вперёд!\n>>> Вперёд!\n>>> Вперёд!",
    "tasks": [
      {
        "f": "choice",
        "code": "for step in range(3):\n    print(\"Вперёд!\")",
        "q": "Сколько раз дрон напечатает «Вперёд!»?",
        "opts": [
          {
            "t": "3 раза",
            "ok": true
          },
          {
            "t": "1 раз",
            "ok": false
          }
        ],
        "hint": "range(3) даёт три значения: 0, 1 и 2."
      },
      {
        "f": "reorder",
        "q": "Собери цикл, который трижды выводит сигнал:",
        "blks": [
          "for step in range(3):",
          "    print(\"Сигнал\")"
        ],
        "hint": "Сначала заголовок for, затем команда с отступом."
      },
      {
        "f": "write",
        "q": "Напиши цикл, который трижды выводит GO:",
        "targetCheck": {
          "contains": [
            "for",
            "range",
            "print"
          ],
          "expectedOutput": "GO\nGO\nGO"
        },
        "hint": "Используй for step in range(3): и print(\"GO\") с отступом."
      }
    ],
    "unitId": 1
  },
  {
    "id": 2,
    "diff": 1,
    "title": "Счёт от нуля",
    "desc": "Посмотри, какие значения получает переменная цикла.",
    "theoryRule": "В range(4) счёт начинается с нуля: цикл получает 0, 1, 2 и 3. Верхняя граница не включается.",
    "theoryCode": "for step in range(4):\n    print(step)",
    "theoryOutput": ">>> 0\n>>> 1\n>>> 2\n>>> 3",
    "tasks": [
      {
        "f": "choice",
        "code": "for step in range(4):\n    print(step)",
        "q": "Какое число появится первым?",
        "opts": [
          {
            "t": "0",
            "ok": true
          },
          {
            "t": "1",
            "ok": false
          }
        ],
        "hint": "Если начальное число не указано, range начинает с нуля."
      },
      {
        "f": "fill",
        "code": "for step in range([ ? ]):\n    print(step)",
        "q": "Сколько повторов задаёт range, чтобы получить 0, 1, 2, 3?",
        "chips": [
          "3",
          "4",
          "5"
        ],
        "ans": "4",
        "hint": "Число в range(n) — это количество повторов."
      },
      {
        "f": "write",
        "q": "Выведи числа 0, 1, 2 и 3, каждое с новой строки:",
        "targetCheck": {
          "contains": [
            "for",
            "range",
            "print"
          ],
          "expectedOutput": "0\n1\n2\n3"
        },
        "hint": "Попробуй range(4) и вывод переменной цикла."
      }
    ],
    "unitId": 1
  },
  {
    "id": 3,
    "diff": 2,
    "title": "Выбираем начало и конец",
    "desc": "Запускай счётчик с нужного значения.",
    "theoryRule": "В range(2, 5) первое число — 2, а 5 — граница остановки и в цикл не входит. Получатся 2, 3 и 4.",
    "theoryCode": "for step in range(2, 5):\n    print(step)",
    "theoryOutput": ">>> 2\n>>> 3\n>>> 4",
    "tasks": [
      {
        "f": "choice",
        "code": "for step in range(2, 5):\n    print(step)",
        "q": "Какое последнее число напечатает цикл?",
        "opts": [
          {
            "t": "4",
            "ok": true
          },
          {
            "t": "5",
            "ok": false
          }
        ],
        "hint": "Верхняя граница range не включается."
      },
      {
        "f": "fill",
        "code": "for step in range(2, [ ? ]):\n    print(step)",
        "q": "Какую границу указать, чтобы вывести 2, 3 и 4?",
        "chips": [
          "4",
          "5",
          "6"
        ],
        "ans": "5",
        "hint": "Укажи число на единицу больше последнего нужного."
      },
      {
        "f": "write",
        "q": "Выведи числа 2, 3 и 4 по одному в строке:",
        "targetCheck": {
          "contains": [
            "for",
            "range",
            "print"
          ],
          "expectedOutput": "2\n3\n4"
        },
        "hint": "Поставь 2 первым аргументом range, а границей — 5."
      }
    ],
    "unitId": 1
  },
  {
    "id": 4,
    "diff": 2,
    "title": "Повторяем нужное число раз",
    "desc": "Подбери размер диапазона под задачу.",
    "theoryRule": "Если нужно выполнить действие пять раз, удобно написать range(5). Значения счётчика будут от 0 до 4.",
    "theoryCode": "for beacon in range(5):\n    print(\"Маяк включён\")",
    "theoryOutput": ">>> Маяк включён\n… ещё 4 раза",
    "tasks": [
      {
        "f": "choice",
        "code": "for beacon in range(5):\n    print(\"Маяк\")",
        "q": "Сколько маяков включится?",
        "opts": [
          {
            "t": "5",
            "ok": true
          },
          {
            "t": "4",
            "ok": false
          }
        ],
        "hint": "Одно значение range соответствует одному повтору."
      },
      {
        "f": "fill",
        "code": "for beacon in range([ ? ]):\n    print(\"Маяк\")",
        "q": "Какое число задаст ровно 6 повторов?",
        "chips": [
          "5",
          "6",
          "7"
        ],
        "ans": "6",
        "hint": "В range(n) число n задаёт количество повторов."
      },
      {
        "f": "reorder",
        "q": "Собери команду для четырёх проверок датчика:",
        "blks": [
          "for check in range(4):",
          "    print(\"Проверка\")"
        ],
        "hint": "Количество проверок задаёт range(4), действие идёт с отступом."
      }
    ],
    "unitId": 1
  },
  {
    "id": 5,
    "diff": 3,
    "title": "Не теряем последний шаг",
    "desc": "Избегай ошибки на единицу при выборе границы.",
    "theoryRule": "Чтобы посчитать от 1 до 5 включительно, укажи range(1, 6). Последнее число диапазона служит границей и не выводится.",
    "theoryCode": "for floor in range(1, 6):\n    print(floor)",
    "theoryOutput": ">>> 1\n>>> 2\n>>> 3\n>>> 4\n>>> 5",
    "tasks": [
      {
        "f": "choice",
        "code": "for floor in range(1, 6):\n    print(floor)",
        "q": "Сколько этажей будет проверено?",
        "opts": [
          {
            "t": "5 этажей",
            "ok": true
          },
          {
            "t": "6 этажей",
            "ok": false
          }
        ],
        "hint": "Числа 1, 2, 3, 4 и 5 — всего пять повторов."
      },
      {
        "f": "bug",
        "q": "Найди ошибку: нужно пройти этажи с 1 по 5 включительно.",
        "lines": [
          {
            "t": "for floor in range(1, 5):",
            "err": true
          },
          {
            "t": "    print(floor)",
            "err": false
          }
        ],
        "hint": "Граница 5 не входит в диапазон. Чтобы включить пятый этаж, остановись на 6."
      },
      {
        "f": "write",
        "q": "Выведи числа от 1 до 5 включительно:",
        "targetCheck": {
          "contains": [
            "for",
            "range",
            "print"
          ],
          "expectedOutput": "1\n2\n3\n4\n5"
        },
        "hint": "Начни с 1, а границу range поставь 6."
      }
    ],
    "unitId": 1
  },
  {
    "id": 6,
    "diff": 3,
    "title": "Читаем счётчик",
    "desc": "Используй переменную цикла внутри команды.",
    "theoryRule": "Переменная после for получает новое значение на каждом повторе. Её можно подставить в текст или использовать в вычислении.",
    "theoryCode": "for step in range(1, 4):\n    print(\"Шаг\", step)",
    "theoryOutput": ">>> Шаг 1\n>>> Шаг 2\n>>> Шаг 3",
    "tasks": [
      {
        "f": "choice",
        "code": "for step in range(1, 4):\n    print(step * 2)",
        "q": "Что выведет цикл?",
        "opts": [
          {
            "t": "2, 4, 6",
            "ok": true
          },
          {
            "t": "2, 2, 2",
            "ok": false
          }
        ],
        "hint": "step меняется от 1 до 3, а каждое значение умножается на 2."
      },
      {
        "f": "reorder",
        "q": "Собери вывод номера каждого шага:",
        "blks": [
          "for step in range(1, 4):",
          "    print(\"Шаг\", step)"
        ],
        "hint": "Имя переменной из заголовка используй внутри цикла."
      },
      {
        "f": "write",
        "q": "Выведи удвоенные числа 2, 4 и 6:",
        "targetCheck": {
          "contains": [
            "for",
            "range",
            "print",
            "*"
          ],
          "expectedOutput": "2\n4\n6"
        },
        "hint": "Цикл по range(1, 4), внутри выведи step * 2."
      }
    ],
    "unitId": 1
  },
  {
    "id": 7,
    "diff": 4,
    "title": "Складываем шаги",
    "desc": "Накапливай результат повторяющимся действием.",
    "theoryRule": "Переменную для суммы создай до цикла. На каждом повторе прибавляй к ней текущее значение счётчика.",
    "theoryCode": "total = 0\nfor step in range(1, 4):\n    total = total + step\nprint(total)",
    "theoryOutput": ">>> 6",
    "tasks": [
      {
        "f": "choice",
        "code": "total = 0\nfor step in range(1, 4):\n    total = total + step\nprint(total)",
        "q": "Какой итог получится после сложения 1 + 2 + 3?",
        "opts": [
          {
            "t": "6",
            "ok": true
          },
          {
            "t": "3",
            "ok": false
          }
        ],
        "hint": "Сумма накапливает каждое значение: сначала 1, потом 3, затем 6."
      },
      {
        "f": "reorder",
        "q": "Собери программу, считающую сумму от 1 до 3:",
        "blks": [
          "total = 0",
          "for step in range(1, 4):",
          "    total = total + step",
          "print(total)"
        ],
        "hint": "Создай сумму до цикла, обновляй внутри, выведи после цикла."
      },
      {
        "f": "write",
        "q": "Напиши программу, которая выведет сумму 1 + 2 + 3:",
        "targetCheck": {
          "contains": [
            "total",
            "for",
            "range",
            "print"
          ],
          "expectedOutput": "6"
        },
        "hint": "Начни с total = 0, внутри прибавляй step, затем выведи total."
      }
    ],
    "unitId": 1
  },
  {
    "id": 8,
    "diff": 4,
    "title": "Команды внутри цикла",
    "desc": "Проверь, почему отступ меняет результат программы.",
    "theoryRule": "Все строки с отступом после for выполняются на каждом повторе. Строка без отступа запускается один раз после завершения цикла.",
    "theoryCode": "for step in range(1, 4):\n    print(\"Этап\", step)\nprint(\"Готово\")",
    "theoryOutput": ">>> Этап 1\n>>> Этап 2\n>>> Этап 3\n>>> Готово",
    "tasks": [
      {
        "f": "choice",
        "code": "for step in range(3):\n    print(\"Бип\")\nprint(\"Старт\")",
        "q": "Сколько раз появится слово «Старт»?",
        "opts": [
          {
            "t": "1 раз",
            "ok": true
          },
          {
            "t": "3 раза",
            "ok": false
          }
        ],
        "hint": "У print(\"Старт\") нет отступа, поэтому она находится за пределами цикла."
      },
      {
        "f": "bug",
        "q": "Найди строку без нужного отступа: обе команды должны повторяться.",
        "lines": [
          {
            "t": "for step in range(3):",
            "err": false
          },
          {
            "t": "print(\"Вперёд\")",
            "err": true
          }
        ],
        "hint": "Команда тела цикла должна быть с отступом под строкой for."
      },
      {
        "f": "reorder",
        "q": "Помести обе команды внутрь цикла:",
        "blks": [
          "for step in range(2):",
          "    print(\"Вперёд\")",
          "    print(\"Поворот\")"
        ],
        "hint": "Обе команды тела должны быть ниже заголовка и иметь одинаковый отступ."
      }
    ],
    "unitId": 1
  },
  {
    "id": 9,
    "diff": 5,
    "title": "Проходим список точек",
    "desc": "Повтори команду для каждого элемента списка.",
    "theoryRule": "Цикл for может перебирать список. На каждом повторе переменная принимает следующий элемент.",
    "theoryCode": "points = [\"Север\", \"Центр\", \"Юг\"]\nfor point in points:\n    print(point)",
    "theoryOutput": ">>> Север\n>>> Центр\n>>> Юг",
    "tasks": [
      {
        "f": "choice",
        "code": "points = [\"Север\", \"Центр\", \"Юг\"]\nfor point in points:\n    print(point)",
        "q": "В каком порядке дрон проверит точки?",
        "opts": [
          {
            "t": "Север, Центр, Юг",
            "ok": true
          },
          {
            "t": "Юг, Центр, Север",
            "ok": false
          }
        ],
        "hint": "for проходит список по порядку, от первого элемента к последнему."
      },
      {
        "f": "fill",
        "code": "for point in [\"А\", \"Б\", \"В\"]:\n    print([ ? ])",
        "q": "Какое имя переменной нужно вывести?",
        "chips": [
          "point",
          "points",
          "step"
        ],
        "ans": "point",
        "hint": "После for переменная point содержит текущий элемент."
      },
      {
        "f": "write",
        "q": "Пройди три контрольные точки и выведи каждую:",
        "targetCheck": {
          "contains": [
            "for",
            "in",
            "print"
          ],
          "expectedOutput": "A\nB\nC"
        },
        "hint": "Можно пройти список [\"A\", \"B\", \"C\"] через for point in points."
      }
    ],
    "unitId": 1
  },
  {
    "id": 10,
    "diff": 5,
    "title": "Повторяем маршрут",
    "desc": "Сочетай список и счётчик в простом алгоритме.",
    "theoryRule": "В цикле можно использовать значение текущего шага вместе с элементами списка, чтобы выводить подробный маршрут.",
    "theoryCode": "points = [\"Маяк\", \"Мост\", \"Финиш\"]\nfor step in range(3):\n    print(step + 1, points[step])",
    "theoryOutput": ">>> 1 Маяк\n>>> 2 Мост\n>>> 3 Финиш",
    "tasks": [
      {
        "f": "choice",
        "code": "points = [\"Маяк\", \"Мост\", \"Финиш\"]\nfor step in range(3):\n    print(step + 1, points[step])",
        "q": "Какой номер будет у точки «Финиш»?",
        "opts": [
          {
            "t": "3",
            "ok": true
          },
          {
            "t": "2",
            "ok": false
          }
        ],
        "hint": "Это третий элемент списка, а step начинается с 0, поэтому выводится step + 1."
      },
      {
        "f": "reorder",
        "q": "Собери цикл, который подпишет точки маршрута:",
        "blks": [
          "for step in range(3):",
          "    print(step + 1, points[step])"
        ],
        "hint": "Счётчик и индекс списка обновляются на каждом повторе."
      },
      {
        "f": "write",
        "q": "Выведи номера 1, 2 и 3, умноженные на 10:",
        "targetCheck": {
          "contains": [
            "for",
            "range",
            "print"
          ],
          "expectedOutput": "10\n20\n30"
        },
        "hint": "Пройди range(1, 4) и выведи step * 10."
      }
    ],
    "unitId": 1
  },
  {
    "id": 11,
    "diff": 6,
    "title": "Две координаты",
    "desc": "Пойми, как два цикла помогают обойти небольшую сетку.",
    "theoryRule": "Вложенный цикл запускается внутри другого. Для каждой строки внутренний цикл проходит все столбцы.",
    "theoryCode": "for row in range(2):\n    for col in range(3):\n        print(row, col)",
    "theoryOutput": ">>> 0 0\n>>> 0 1\n>>> 0 2\n>>> 1 0\n…",
    "tasks": [
      {
        "f": "choice",
        "code": "for row in range(2):\n    for col in range(3):\n        print(row, col)",
        "q": "Сколько координатных пар проверит дрон?",
        "opts": [
          {
            "t": "6",
            "ok": true
          },
          {
            "t": "5",
            "ok": false
          }
        ],
        "hint": "Две строки по три точки: 2 × 3 = 6 пар."
      },
      {
        "f": "reorder",
        "q": "Собери обход сетки из двух строк и двух столбцов:",
        "blks": [
          "for row in range(2):",
          "    for col in range(2):",
          "        print(row, col)"
        ],
        "hint": "Цикл по столбцам должен находиться внутри цикла по строкам."
      },
      {
        "f": "write",
        "q": "Выведи координаты трёх столбцов строки 0:",
        "targetCheck": {
          "contains": [
            "for",
            "range",
            "print"
          ],
          "expectedOutput": "0 0\n0 1\n0 2"
        },
        "hint": "Оставь один цикл for col in range(3) и выведи 0 и col."
      }
    ],
    "unitId": 1
  },
  {
    "id": 12,
    "diff": 6,
    "title": "Финальный маршрут",
    "desc": "Собери знания в алгоритм проверки точек и подсчёта шагов.",
    "theoryRule": "В финальном задании соедини несколько знакомых идей: список точек, цикл, счётчик и вывод результата.",
    "theoryCode": "points = [\"Старт\", \"Маяк\", \"Финиш\"]\nfor step in range(3):\n    print(step + 1, points[step])",
    "theoryOutput": ">>> 1 Старт\n>>> 2 Маяк\n>>> 3 Финиш",
    "tasks": [
      {
        "f": "choice",
        "code": "for step in range(1, 5):\n    print(step)",
        "q": "Сколько остановок задаёт range(1, 5)?",
        "opts": [
          {
            "t": "4 остановки",
            "ok": true
          },
          {
            "t": "5 остановок",
            "ok": false
          }
        ],
        "hint": "Числа 1, 2, 3 и 4 — четыре остановки; 5 не включается."
      },
      {
        "f": "reorder",
        "q": "Собери финальный обход трёх точек:",
        "blks": [
          "points = [\"Старт\", \"Маяк\", \"Финиш\"]",
          "for step in range(3):",
          "    print(points[step])"
        ],
        "hint": "Подготовь список, затем запусти цикл и выведи текущую точку."
      },
      {
        "f": "write",
        "q": "Пройди список A, B, C и выведи точки по порядку:",
        "targetCheck": {
          "contains": [
            "for",
            "in",
            "print"
          ],
          "expectedOutput": "A\nB\nC"
        },
        "hint": "Запиши points = [\"A\", \"B\", \"C\"], затем перебери points через for."
      }
    ],
    "unitId": 1
  }
].map(({ unitId, ...lesson }) => ({ ...lesson, unit: UNITS.find(unit => unit.id === unitId) }));

export { MASCOTS, SECTIONS, UNITS, ALL_LESSONS };
