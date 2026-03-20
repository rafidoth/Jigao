import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import type { Variants } from "framer-motion";
import { ChevronDownIcon, X } from "lucide-react";

export type TSelectData = {
  id: string;
  label: string;
  value: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  custom?: React.ReactNode;
};

type SelectProps = {
  title?: string;
  data?: TSelectData[];
  onChange?: (value: string) => void;
  defaultValue?: string;
};

const Select = ({ title, data, defaultValue, onChange }: SelectProps) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<TSelectData | undefined>(undefined);

  useEffect(() => {
    if (defaultValue) {
      const item = data?.find((i) => i.value === defaultValue);
      if (item) {
        setSelected(item);
      }
    } else {
      setSelected(data?.[0]);
    }
  }, [defaultValue, data]);

  const onSelect = (value: string) => {
    const item = data?.find((i) => i.value === value);
    setSelected(item as TSelectData);
    setOpen(false);
    onChange?.(value);
  };

  return (
    <MotionConfig
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        ease: [0.65, 0, 0.35, 1],
      }}
    >
      <motion.div className="flex items-center justify-center font-display">
        <AnimatePresence mode="popLayout">
          {!open ? (
            <motion.div
              whileTap={{ scale: 0.95 }}
              animate={{
                borderRadius: 30,
              }}
              layout
              layoutId="dropdown"
              onClick={() => setOpen(true)}
              className="overflow-hidden  border border-input bg-background shadow-sm"
            >
              <SelectItem item={selected} />
            </motion.div>
          ) : (
            <motion.div
              layout
              animate={{
                borderRadius: 20,
              }}
              layoutId="dropdown"
              className="overflow-hidden rounded-[20px]  w-full md:w-[400px] border border-input bg-background py-2 shadow-md"
              ref={ref}
            >
              <Head title={title} setOpen={setOpen} />
              <div className="w-full overflow-y-auto">
                {data?.map((item, index) => (
                  <SelectItem
                    order={index}
                    value={item.value}
                    noDescription={false}
                    key={item.id}
                    item={item}
                    onChange={onSelect}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
};

export default Select;

const Head = ({
  setOpen,
  title,
}: {
  setOpen: (open: boolean) => void;
  title?: string;
}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        delay: 0.1,
      }}
      layout
      className="flex items-center justify-between p-4"
    >
      <motion.strong layout className="text-foreground">
        {title ? title : "Choose Model"}
      </motion.strong>
      <button
        onClick={() => setOpen(false)}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary"
      >
        <X className="text-secondary-foreground" size={12} />
      </button>
    </motion.div>
  );
};

type SelectItemProps = {
  item?: TSelectData;
  noDescription?: boolean;
  order?: number;
  value?: string;
  onChange?: (value: string) => void;
};

const animation: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.5,
    },
  }),
  exit: (custom: number = 0) => ({
    opacity: 0,
    y: 10,
    transition: {
      delay: custom * 0.1,
    },
  }),
};

const SelectItem = ({
  item,
  noDescription = true,
  order,
  value,
  onChange,
}: SelectItemProps) => {
  return (
    <motion.div
      className={`group flex cursor-pointer items-center justify-between gap-2 p-4 py-2 hover:bg-accent hover:text-accent-foreground ${
        noDescription && "!p-2"
      }`}
      variants={animation}
      initial="hidden"
      animate="visible"
      exit="exit"
      key={"product-" + item?.id + "-order-" + order}
      custom={order ?? 0}
      onClick={() => value && onChange?.(value)}
    >
      <div className="flex items-center gap-3">
        <motion.div
          layout
          layoutId={`icon-${item?.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-input"
        >
          {item?.icon}
        </motion.div>
        <motion.div layout className="flex w-56 flex-col">
          <motion.strong
            layoutId={`label-${item?.id}`}
            className="text-xs font-semibold text-foreground"
          >
            {item?.label}
          </motion.strong>
          {noDescription ? null : (
            <span className="truncate text-xs text-muted-foreground">
              {item?.description}
            </span>
          )}
        </motion.div>
      </div>
      {noDescription ? (
        <motion.div
          layout
          className="flex items-center justify-center gap-2 pr-3"
        >
          <ChevronDownIcon className="text-foreground" size={20} />
        </motion.div>
      ) : null}
    </motion.div>
  );
};
